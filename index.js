const { Client, Events, GatewayIntentBits, PermissionsBitField, EmbedBuilder, UserSelectMenuBuilder } = require('discord.js');
const { token } = require('./config.json');

// Import from modules
const { getRandInt, selectRandomLimb, handleProbability } = require('./utils');
const { 
    setPlayerStatus, 
    removePlayerStatus, 
    addPlayerItem, 
    removePlayerItem, 
    removePlayerAlly, 
    addPlayerAlly, 
    addPlayerKills,
    createPlayerFunctions 
} = require('./player');
const { 
    handleTreeEvent, 
    handleBerryEvent, 
    handleStealEvent, 
    handleSponsorEvent, 
    handleSick, 
    handleAlly 
} = require('./events');
const { 
    hatchet, 
    knife, 
    explosives, 
    fists, 
    molotov, 
    bow 
} = require('./combat');
const { createCommandHandlers } = require('./commands');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers, // Added to fetch guild members
    ] 
});

client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);
});

let isDay = true;
let dayNumber = 1;
let nightNumber = 1;
var players = {};
const BETRAYAL_CHANCE = 0.05;

const items = [
    "medkit",
    "antidote",
    "hatchet",
    "bow",
    "knife",
    "explosives",
    "molotov"
];

// Create player functions with players dependency
const { addPlayerEvent } = createPlayerFunctions(players);


function selectRandomVictim(player) {
    const availableVictims = Object.keys(players).filter(name => name !== player.name && !players[name].status.includes('deceased'));
    if (availableVictims.length === 0) return null; // No available victims
    const victimName = availableVictims[getRandInt(0, availableVictims.length - 1)];
    return players[victimName];
}

// Function to Select and Process an Event for a Player
const selectEvent = (player) => {
    // Check special conditions first (before random selection)
    if (player.status.includes('sick') && player.items.includes('antidote')){
        return handleSick(player);
    }
    
    const victim = selectRandomVictim(player);
    if (!victim){
        return `**${player.name}** tried to steal from someone, but couldn't find anyone.`;
    }
    
    const item = items[getRandInt(0, items.length - 1)];
    const stealItem = victim.items[getRandInt(0, victim.items.length - 1)];
    const events = [
        () => `**${player.name}** is out hunting.`,
        () => `**${player.name}** questions their sanity.`,
        () => `**${player.name}** picks flowers.`,
        () => `**${player.name}** runs away from **${victim.name}**.`,
        () => `**${player.name}** thinks about home.`,
        () => `**${player.name}** thinks about winning`,
        () => `**${player.name}** screams for help`,
        () => `**${player.name}** reminices about the past`,
        () => `**${player.name}** wants to go exploring, but fears the dangers of other people`,
        () => `**${player.name}** wants it to be all over soon`,
        () => `**${player.name}** hates **${victim.name}**`,
        () => `**${player.name}** onlooks the distance`,
        () => `**${player.name}** and **${victim.name}** discuss the situation.`,
        () => `**${player.name}** regrets their actions`,
        () => `**${player.name}** constructs a shack`,
        () => `**${player.name}** wants everyone to get along.`,

        () => handleAlly(player, victim),
        () => handleSponsorEvent(player, item),
        () => handleStealEvent(player, stealItem, victim),
        () => handleBerryEvent(player),
        () => handleTreeEvent(player),
    ];
    
    // Now do the random selection (no more overrides after this!)
    const randomEvent = events[getRandInt(0, events.length - 1)];
    return randomEvent();
};

const selectNightEvent = (player) => {
    const victim = selectRandomVictim(player);
    const events = [
        () => `**${player.name}** and **${victim.name}** snuggle together for warmth.`,
        () => `**${player.name}** is feeling drowsy.`,
        () => `**${player.name}** cries themselves to sleep.`,
        () => `**${player.name}** finds it hard to sleep`,
        () => `**${player.name}** wants to sleep, but fears for their safety.`,
        () => `**${player.name}** shivers in the freezing night`,
        () => `**${player.name}** makes a makeshift blanket out of leaves and dirt to shield themselves from the cold.`,
        () => `**${player.name}** makes a campfire to sleep by.`,
        () => `**${player.name}** thinks about the deceased as they doze off.`,
        () => handleTreeEvent(player),
    ];
    const randomEvent = events[getRandInt(0, events.length - 1)];
    return randomEvent();
}

const selectCombatEvent = (player, ally=null) => {
    const victim = selectRandomVictim(player);
    const playerInvItem = player.items[getRandInt(0, player.items.length - 1)]
    const events = {
        "hatchet": {
            "decapitate": () => hatchet(player, victim, 'decapitate'),
        },
        "knife": {
            "stabHeart": () => knife(player, victim, 'heart'),
            "slitThroat": () => knife(player, victim, 'throat'),
        },
        "explosives": {
            "detonate": () => explosives(player, victim, 'detonate'),
        },
        "fists": {
            "beat": () => fists(player, victim, 'beat'),
            "overpower": () => fists(player, victim, 'overpower'),
            "strangulate": () => fists(player, victim, 'strangle'),
            "neckSnap": () => fists(player, victim, "neckSnap"),
        },
        "molotov": {
            "throw": () => molotov(player, victim, 'throw'),
            "miss": () => molotov(player, victim, 'miss'),
        },
        "bow": {
            "hit_heart": () => bow(player, victim, 'hit_heart'),
            "hit_limb": () => bow(player, victim, 'hit_limb'),
        },
    };
    
    let event;
    
    function getRandomEvent(eventType) {
        const eventKeys = Object.keys(events[eventType]);
        const randomKey = eventKeys[getRandInt(0, eventKeys.length - 1)];
        return events[eventType][randomKey];
    }
    
    // Select a random event based on the player's item
    console.log(playerInvItem);
    switch (playerInvItem) {
        case 'hatchet':
            event = getRandomEvent('hatchet');
            break;
        case 'knife':
            event = getRandomEvent('knife');
            break;
        case 'explosives':
            event = getRandomEvent('explosives');
            break;
        case 'bow':
            event = getRandomEvent('bow');
            break;
        default:
            event = getRandomEvent('fists');
            break;
    };
    
    // Call the selected event function
    return event();

};

function handleBetrayal(player) {
    if (player.allies.length === 0) return null;

    // Select a random ally to betray
    const allyName = player.allies[getRandInt(0, player.allies.length - 1)];
    const ally = players[allyName];

    if (!ally) return null;

    // Determine the outcome of the betray.
    let msg1 = `${player.name} betrayed ${allyName} and ${selectCombatEvent(player, ally)}`
    // Remove the alliance from both players
    removePlayerAlly(player, allyName);
    removePlayerAlly(ally, player.name);

    return msg1;
};

// Main Function to Process Daily Events
async function main(channelId) {
    const channel = client.channels.cache.get(channelId);
    const eventArr = [];

    // Set the title based on whether it's day or night
    const embed = new EmbedBuilder()
        .setTitle(isDay ? `--- Day ${dayNumber} Events ---` : `--- Night ${nightNumber} Events ---`)
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({ text: 'Use the `/next` command to proceed!' });

    // Process events for each player
    Object.values(players).forEach(player => {
        if (!player.status.includes('deceased')) {
            const ifAttack = Math.random() < 0.15 ? "attack" : "normal";

            // Determine event type based on whether it's day or night
            let event;
            if (ifAttack === "attack") {
                event = selectCombatEvent(player);
            } else if (isDay) {
                event = selectEvent(player); // Day event
            } else {
                event = selectNightEvent(player); // Night event
            }

            eventArr.push(event);
            
            // Track this event for the player
            const timeLabel = isDay ? "Day" : "Night";
            const timeNumber = isDay ? dayNumber : nightNumber;
            addPlayerEvent(player.name, event, timeLabel, timeNumber);
            
            // Also track events for other players mentioned in the event
            Object.keys(players).forEach(otherPlayerName => {
                if (otherPlayerName !== player.name && event.includes(`**${otherPlayerName}**`)) {
                    addPlayerEvent(otherPlayerName, event, timeLabel, timeNumber);
                }
            });

            // Handle betrayal event during both day and night
            if (player.allies.length > 0 && Math.random() < BETRAYAL_CHANCE) {
                const betrayalEvent = handleBetrayal(player);
                if (betrayalEvent) {
                    eventArr.push(betrayalEvent);
                    addPlayerEvent(player.name, betrayalEvent, timeLabel, timeNumber);
                    
                    // Track betrayal for other players mentioned
                    Object.keys(players).forEach(otherPlayerName => {
                        if (otherPlayerName !== player.name && betrayalEvent.includes(otherPlayerName)) {
                            addPlayerEvent(otherPlayerName, betrayalEvent, timeLabel, timeNumber);
                        }
                    });
                }
            }
        }
    });

    // Compile event messages
    embed.setDescription(eventArr.length ? eventArr.join('\n\n') : "No events occurred today.");

    // Check for a winner
    const alivePlayers = Object.values(players).filter(player => !player.status.includes('deceased'));
    if (alivePlayers.length === 1) {
        embed.addFields({
            name: "🏆 Winner",
            value: `${alivePlayers[0].name} wins!`,
            inline: false
        });
        players = {};
        dayNumber = 1;
        nightNumber = 0;
        isDay = true; // Reset to day
    } else {
        // Increment respective counters
        if (isDay) {
            dayNumber++;
        } else {
            nightNumber++;
        }
        isDay = !isDay; // Toggle between day and night
    }

    await channel.send({ embeds: [embed] });
};


// Create command handlers with dependencies
const commandHandlers = createCommandHandlers(players, main);

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;
    /*if (!interaction.member.roles.cache.some(role => role.name === 'Hunger Gamer')){
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }*/

    const { commandName } = interaction;

    switch (commandName) {
        case 'start':
            return commandHandlers.handleStartCommand(interaction);
        case 'next':
            return commandHandlers.handleNextCommand(interaction);
        case 'status':
            return commandHandlers.handleStatusCommand(interaction);
        case 'events':
            return commandHandlers.handleEventsCommand(interaction);
        default:
            return interaction.reply({ content: 'Unknown command.', ephemeral: true });
    }
})
client.login(token);
console.log('All modules loaded successfully! Modular refactoring complete.');
