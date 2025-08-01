const { Client, Events, GatewayIntentBits, PermissionsBitField, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json');

// Import from modules
const { getRandInt, selectRandomLimb, handleProbability } = require('./game/utils');
const { 
    setPlayerStatus, 
    removePlayerStatus, 
    addPlayerItem, 
    removePlayerItem, 
    removePlayerAlly, 
    addPlayerAlly, 
    addPlayerKills,
    createPlayerFunctions 
} = require('./game/player');
const { 
    handleTreeEvent, 
    handleBerryEvent, 
    handleStealEvent, 
    handleSponsorEvent, 
    handleSick, 
    handleAlly,
    handleRivalEvent
} = require('./game/events');
const { 
    hatchet, 
    knife, 
    explosives, 
    fists, 
    molotov, 
    bow 
} = require('./game/combat');
const { createCommandHandlers } = require('./game/commands');

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
    const availableVictims = Object.keys(players).filter(name => name !== player.name && !players[name].status.includes('Deceased'));
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
            "decapitate": () => hatchet(player, victim, 'decapitate', players),
        },
        "knife": {
            "stabHeart": () => knife(player, victim, 'heart', players),
            "slitThroat": () => knife(player, victim, 'throat', players),
        },
        "explosives": {
            "detonate": () => explosives(player, victim, 'detonate', players),
        },
        "fists": {
            "beat": () => fists(player, victim, 'beat', players),
            "overpower": () => fists(player, victim, 'overpower', players),
            "strangulate": () => fists(player, victim, 'strangle', players),
            "neckSnap": () => fists(player, victim, "neckSnap", players),
            "escape": () => fists(player, victim, "escape", players),
        },
        "molotov": {
            "throw": () => molotov(player, victim, 'throw', players),
            "miss": () => molotov(player, victim, 'miss', players),
        },
        "bow": {
            "hit_heart": () => bow(player, victim, 'hit_heart', players),
            "hit_limb": () => bow(player, victim, 'hit_limb', players),
        },
    };
    
    let event;
    
    function getRandomEvent(eventType) {
        const eventKeys = Object.keys(events[eventType]);
        const randomKey = eventKeys[getRandInt(0, eventKeys.length - 1)];
        return events[eventType][randomKey];
    }

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


    const embed = new EmbedBuilder()
        .setTitle(isDay ? `--- Day ${dayNumber} Events ---` : `--- Night ${nightNumber} Events ---`)
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({ text: 'Use the button below or `/next` command to proceed!' });

    // Process events for each player
    Object.values(players).forEach(player => {
        if (!player.status.includes('Deceased')) {
            const ifAttack = Math.random() < 0.15 ? "attack" : "normal";


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
            

            Object.keys(players).forEach(otherPlayerName => {
                if (otherPlayerName !== player.name && event.includes(`**${otherPlayerName}**`)) {
                    addPlayerEvent(otherPlayerName, event, timeLabel, timeNumber);
                }
            });

            if (player.allies.length > 0 && Math.random() < BETRAYAL_CHANCE) {
                const betrayalEvent = handleBetrayal(player);
                if (betrayalEvent) {
                    eventArr.push(betrayalEvent);
                    addPlayerEvent(player.name, betrayalEvent, timeLabel, timeNumber);
                    

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
    const alivePlayers = Object.values(players).filter(player => !player.status.includes('Deceased'));
    if (alivePlayers.length === 1) {
        embed.addFields({
            name: "🏆 Winner",
            value: `${alivePlayers[0].name} wins!`,
            inline: false
        });
        // Clear players object while keeping the same reference
        Object.keys(players).forEach(key => delete players[key]);
        dayNumber = 1;
        nightNumber = 0;
        isDay = true;
    } else {
        if (isDay) {
            dayNumber++;
        } else {
            nightNumber++;
        }
        isDay = !isDay;
    }

    if (alivePlayers.length > 1) {
        const nextButton = new ButtonBuilder()
            .setCustomId('next_event')
            .setLabel('Next Event')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('▶️');
        
        const row = new ActionRowBuilder()
            .addComponents(nextButton);
        
        await channel.send({ 
            embeds: [embed], 
            components: [row] 
        });
    } else {
        await channel.send({ embeds: [embed] });
    }
};


// Create command handlers with dependencies
const commandHandlers = createCommandHandlers(players, main);

client.on(Events.InteractionCreate, async interaction => {
    // Handle button interactions
    if (interaction.isButton()) {
        if (interaction.customId === 'next_event') {
            main(interaction.channel.id);
            return interaction.reply({ content: 'Proceeding to next event...', ephemeral: true });
        }
        return;
    }
    
    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'status_player_select') {
            return commandHandlers.handleStatusSelectMenu(interaction);
        }
        return;
    }
    
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
