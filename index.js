const { Client, Events, GatewayIntentBits, PermissionsBitField, EmbedBuilder, UserSelectMenuBuilder } = require('discord.js');
const { token } = require('./config.json');

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

// Centralized Probabilities Configuration
const probabilities = {
    "tree": [
        { chance: 20, result: 'fall_and_die' },
        { chance: 40, result: 'stay_night' },
        { chance: 40, result: 'find_fruits' }
    ],
    "berry": [
        { chance: 20, result: 'die' },
        { chance: 80, result: 'sick' }
    ],
    "sick": [
        { chance: 50, result: 'die' },
        { chance: 50, result: 'live' }
    ],
    "steal": [
        { chance: 25, result: 'steal' },
        { chance: 65, result: 'spotted_and_run' },
        { chance: 10, result: 'fight_for_items' }
    ],
    "stabNeck": [
        { chance: 50, result: 'kill' },
        { chance: 50, result: 'lose'}
    ],
};



// Helper Functions for Status Management
function setPlayerStatus(player, status) {
    if (!player.status.includes(status)) {
        player.status.push(status);
    };
};

function removePlayerStatus(player, status) {
    player.status = player.status.filter(s => s !== status);
};

const addPlayerItem = (player, item) => {
    player.items.push(item);
};

function removePlayerItem(player, item){
    player.items = player.items.filter(i => i !== item)
};
function removePlayerAlly(player, allyName) {
    player.allies = player.allies.filter(name => name !== allyName);
}

function addPlayerAlly(player, ally){
    if (!player.allies.includes(ally.name)){
        player.allies.push(ally.name);
    }
}

function addPlayerKills(player, victim){
    if (!player.status.includes(victim.name)){
        player.kills.push(victim.name);
    }
};

// Function to add event to player's history
function addPlayerEvent(playerName, event, dayNight, dayNum) {
    if (players[playerName]) {
        players[playerName].eventHistory.push({
            event: event,
            time: `${dayNight} ${dayNum}`,
            timestamp: Date.now()
        });
        // Keep only last 10 events to prevent memory issues
        if (players[playerName].eventHistory.length > 10) {
            players[playerName].eventHistory.shift();
        }
    }
};

function getRandInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function selectRandomLimb(){
    const limbs = [
        "left leg",
        "right leg",
        "left arm",
        "right arm",
        "left hand",
        "right hand"
    ];
    const randomLimb = limbs[getRandInt(0, limbs.length - 1)];
    return randomLimb;
}


function selectRandomVictim(player) {
    const availableVictims = Object.keys(players).filter(name => name !== player.name && !players[name].status.includes('deceased'));
    if (availableVictims.length === 0) return null; // No available victims
    const victimName = availableVictims[getRandInt(0, availableVictims.length - 1)];
    return players[victimName];
}


function handleProbability(eventType) {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const outcome of probabilities[eventType]) {
        cumulative += outcome.chance;
        if (rand <= cumulative) {
            return outcome.result;
        }
    }
    return null; // Fallback
}


// Tree Climbing Event Handler
const handleTreeEvent = (player) => {
    const outcome = handleProbability('tree');
    let eventMessage = '';

    switch (outcome) {
        case 'fall_and_die':
            eventMessage = `**${player.name}** climbs a tree to hide but falls out and dies.`;
            setPlayerStatus(player, 'deceased');
            break;
        case 'stay_night':
            eventMessage = `**${player.name}** climbs a tree and stays there for the night.`;
            player.activity = null; // Reset activity after staying
            break;
        case 'find_fruits':
            eventMessage = `**${player.name}** climbs a tree and finds fruits.`;
            player.items.push('fruits');
            player.activity = null; // Reset activity after finding fruits
            break;
        default:
            eventMessage = `**${player.name}** did something unexpected in the tree.`;
            player.activity = null; // Reset activity to avoid getting stuck
    }

    return eventMessage;
}

// Berry Eating Event Handler
const handleBerryEvent = (player) => {
    const outcome = handleProbability('berry');
    let eventMessage = '';
    

    switch (outcome) {
        case 'die':
            eventMessage = `**${player.name}** ate a poisonous berry and died shortly after.`;
            setPlayerStatus(player, 'deceased');
            break;
        case 'sick':
            eventMessage = `**${player.name}** ate a poisonous berry and is now sick.`;
            setPlayerStatus(player, 'sick');
            break;
        default:
            eventMessage = `**${player.name}** had an unexpected reaction to the berry.`;
            setPlayerStatus(player, 'sick'); // Default to sick to avoid inconsistent state
    }

    return eventMessage;
};

const handleStealEvent = (player, item, victim) => {
    const outcome = handleProbability('steal');
    let stealOutcome;

    let eventMessage = '';


    switch(outcome){
        case 'steal':
            eventMessage = `**${player.name}** managed to steal *${item}* from **${victim.name}**.`
            removePlayerItem(victim, item);
            addPlayerItem(player, item);
            break;
        case 'spotted_and_run':
            eventMessage = `**${player.name}** attempted to steal from **${victim.name}**, but was spotted and fled.`
            break
        case 'fight_for_items':
            if (victim.status.includes('sick')){
                stealOutcome = Math.random() < 0.70 ? 'lose': 'win';
            }else{
                stealOutcome = Math.random() < 0.50 ? 'lose' : 'win';
            }
            if (stealOutcome === 'lose'){
                eventMessage = `**${victim.name}** caught **${player.name}** stealing from them. The 2 fight, but **${victim.name}** wins and scares off **${player.name}**.`
            }else{
                eventMessage = `**${victim.name}** caught **${player.name}** stealing from them. The 2 fight, but **${player.name}** wins and steals **${victim.name}**'s *${item}*.`
                removePlayerItem(victim, item);
                addPlayerItem(player, item);
            };
        };
        if (!item){
            eventMessage = `**${player.name}** tried to steal something from **${victim.name}**, but could not find any belongings.`;
        }
    return eventMessage;
};

const handleSponsorEvent = (player, item) => {
    let eventMessage = `**${player.name}** recieved a *${item}* from an unknown sponsor`;
    addPlayerItem(player, item);
    return eventMessage;
};

const handleSick = (player) => {
    let eventMessage;
    eventMessage = `**${player.name}** used an antidote and cured their illness.`;
    removePlayerStatus(player, 'sick');
    removePlayerItem(player, 'antidote');
    return eventMessage;
};

const handleAlly = (player, ally) => {
    const allyEvent = [
        () => `**${player.name}** and **${ally.name}** agree to fight together.`,
        () => `**${player.name}** and **${ally.name}** decide to band together in hopes of winning.`,
        () => `**${player.name}** and **${ally.name}** become friends.`,
        () => `**${player.name}** and **${ally.name}** have a lot in common and talk about life. they become allies.`,
    ];
    const randomEvent = allyEvent[(getRandInt(0, allyEvent.length - 1))];
    addPlayerAlly(player, ally);
    addPlayerAlly(ally, player); // make sure the ally is also allied with the player
    return randomEvent()
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


const hatchet = (player, victim, type) => {
    let eventMessage;
    switch(type){
        case "decapitate":
            eventMessage = `**${player.name}** decapitated **${victim.name}** with a hatchet.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        default:
            eventMessage = `**${player.name}** mutilated **${victim.name}** with a hatchet.`
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
    }
    return eventMessage;
}

const knife = (player, victim, type) => {
    let eventMessage;
    switch(type){
        case "heart":
            eventMessage = `**${player.name}** stabbed **${victim.name}** in the heart a knife.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        case "throat":
            eventMessage = `**${player.name}** slit **${victim.name}**'s throat with a knife.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        default:
            eventMessage = `**${player.name}** stabbed **${victim.name}** to death with a knife.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
            
    };
    return eventMessage;
};

const explosives = (player, victim, type) => {
    let eventMessage
    switch(type){
        case "detonate":
            eventMessage = `**${player.name}** detonates explosives, killing **${victim.name}** in the blast.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim);
            break;
        default:
            eventMessage = `**${player.name}** uses explosives to kill **${victim.name}**`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
    };
    return eventMessage;
};

const fists = (player, victim, type) => {
    let eventMessage;
    switch(type){
        case "beat":
            eventMessage = `**${player.name}** murked **${victim.name}**, killing them.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        case "overpower":
            eventMessage = `**${player.name}** smashed **${victim.name}**'s head into a tree repeatedly, killing them.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim);
            break;
        case "strangulate":
            eventMessage = `**${player.name}** strangles and chokes **${victim.name}** to death.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        case "neckSnap":
            eventMessage = `**${player.name}** breaks **${victim.name}**'s neck.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        default:
            eventMessage = `**${player.name}** beats **${victim.name}** to death.`;
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
            
    };
    return eventMessage;
};

const molotov = (player, victim, type) => {
    let eventMessage;
    switch(type){
        case "throw":
            eventMessage = `**${player.name}** hurls a molotov at **${victim.name}**, leaving them wit third degree burns.`
            setPlayerStatus(victim, 'deceased');
            addPlayerKills(player, victim)
            break;
        case "miss":
            eventMessage = `**${player.name}** tries to throw a molotov at **${victim.name}**, but it slips out of his hand. **${player.name}** promptly set on fire and died.`
            setPlayerStatus(player, 'deceased');
            break;
        default:
            eventMessage = `**${player.name}** wants to kill someone with a molotov.`
            break;
    }
    return eventMessage
}

const bow = (player, victim, type) => {
    let eventMessage;
    switch(type){
        case "hit_heart":
            eventMessage = `**${player.name}** shot a bow at **${victim.name}** and hit their heart, stopping it.`;
            setPlayerStatus(victim, 'deceased');
            removePlayerItem(player, 'bow');
            addPlayerKills(player, victim)
            break;
        case "hit_limb":
            const limb = selectRandomLimb();
            eventMessage = `**${player.name}** shoots a bow at **${victim.name}** and hits their ${limb}`;
            setPlayerStatus(victim, 'injured');
            removePlayerItem(player, 'bow');
            addPlayerKills(player, victim)
            break;
    };
    return eventMessage;
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


client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;
    /*if (!interaction.member.roles.cache.some(role => role.name === 'Hunger Gamer')){
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }*/

    const { commandName } = interaction;
    const channel = interaction.channel;

    if (commandName === 'start'){
        const allMembers = interaction.options.getBoolean('all_members');
        
        if (allMembers) {
            // Respond immediately to avoid timeout
            await interaction.reply({content: 'Fetching all server members and creating the game...'});
            
            // Get all members from the guild (server)
            try {
                const guild = interaction.guild;
                await guild.members.fetch(); // Fetch all members
                
                // Clear existing players
                players = {};
                
                guild.members.cache.forEach(member => {
                    // Skip bots and add human members
                    if (!member.user.bot) {
                        // Use display name if available, otherwise use username
                        const playerName = member.displayName || member.user.username;
                        players[playerName] = { 
                            name: playerName, 
                            items: [], 
                            status: [], 
                            kills: [], 
                            allies: [], 
                            activity: null,
                            eventHistory: [] // Track events that happen to this player
                        };
                    }
                });
                
                const memberCount = Object.keys(players).length;
                if (memberCount < 2) {
                    await interaction.followUp({content: 'Not enough server members found for a game. Need at least 2 players.'});
                    return;
                }
                
                await interaction.followUp({content: `Successfully created game with ${memberCount} server members! Starting the game...`});
                main(channel.id);
                
            } catch (error) {
                console.error('Error fetching guild members:', error);
                await interaction.followUp({content: 'Error fetching server members. Please try again or use manual player selection.'});
                return;
            }
        } else {
            // Original manual player selection
            const playerNames = interaction.options._hoistedOptions.filter(option => option.name.startsWith('player') && option.value);
            
            if (playerNames.length === 0) {
                await interaction.reply({content: 'Please provide at least one player name or use the `all_members` option to include all server members.', ephemeral: true});
                return;
            }
            
            // Clear existing players
            players = {};
            
            playerNames.forEach(playerName => {
                players[playerName.value] = { name: playerName.value, items: [], status: [], kills: [], allies: [], activity: null, eventHistory: [] };
            });
            await interaction.reply({content: `Creating game with ${playerNames.length} players...`});
            main(channel.id);
        }
    };

    if(commandName === 'next'){
        main(channel.id);
        return interaction.reply({ content: 'Proceeding...'});

    };

    if (commandName === 'status'){
        const playerName = interaction.options._hoistedOptions[0].value;
        if (playerName in players){
            const player = players[playerName];
            const status = player.status.length > 0 ? player.status.join(', ') : 'Healthy';
            const items = player.items.length > 0 ? player.items.join(', ') : 'No items.';
            const allies = player.allies.length > 0 ? player.allies.join(', ') : 'No allies.';
            const kills = player.kills.length > 0 ? player.kills.join(', ') : 'No kills.';
            
            // Get recent events (last 5)
            const recentEvents = player.eventHistory.slice(-5).reverse();
            const eventsText = recentEvents.length > 0 ? 
                recentEvents.map(e => `**${e.time}:** ${e.event.replace(/\*\*/g, '')}`).join('\n') : 
                'No recent events.';
            
            const embed = new EmbedBuilder()
                .setTitle(`Status of ${playerName}`)
                .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                .addFields(
                    { name: 'Status', value: status, inline: true },
                    { name: 'Items', value: items, inline: true },
                    { name: 'Allies', value: allies, inline: true },
                    { name: 'Kills', value: kills, inline: true },
                    { name: 'Recent Events', value: eventsText.length > 1024 ? eventsText.substring(0, 1021) + '...' : eventsText, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Use /next to proceed to the next day.' });
            
            return interaction.reply({ embeds: [embed] });
        }
        else{
            return interaction.reply({ content: `Player not found.` });
        }
    }

    if (commandName === 'events'){
        const playerName = interaction.options._hoistedOptions[0].value;
        if (playerName in players){
            const player = players[playerName];
            
            if (player.eventHistory.length === 0) {
                return interaction.reply({ content: `No events found for ${playerName}.`, ephemeral: true });
            }
            
            // Get all events in reverse chronological order (most recent first)
            const allEvents = player.eventHistory.slice().reverse();
            const eventsText = allEvents.map(e => `**${e.time}:** ${e.event.replace(/\*\*/g, '')}`).join('\n\n');
            
            // Split into multiple embeds if too long
            const maxLength = 4000;
            if (eventsText.length <= maxLength) {
                const embed = new EmbedBuilder()
                    .setTitle(`All Events for ${playerName}`)
                    .setDescription(eventsText)
                    .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                    .setTimestamp()
                    .setFooter({ text: `Total events: ${allEvents.length}` });
                
                return interaction.reply({ embeds: [embed] });
            } else {
                // Split into chunks
                const chunks = [];
                let currentChunk = '';
                
                for (const event of allEvents) {
                    const eventText = `**${event.time}:** ${event.event.replace(/\*\*/g, '')}\n\n`;
                    if ((currentChunk + eventText).length > maxLength) {
                        chunks.push(currentChunk);
                        currentChunk = eventText;
                    } else {
                        currentChunk += eventText;
                    }
                }
                if (currentChunk) chunks.push(currentChunk);
                
                const embeds = chunks.map((chunk, index) => 
                    new EmbedBuilder()
                        .setTitle(index === 0 ? `All Events for ${playerName}` : `Events for ${playerName} (continued)`)
                        .setDescription(chunk)
                        .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                        .setFooter({ text: `Page ${index + 1}/${chunks.length} | Total events: ${allEvents.length}` })
                );
                
                return interaction.reply({ embeds: embeds.slice(0, 10) }); // Discord limit of 10 embeds
            }
        }
        else{
            return interaction.reply({ content: `Player not found.` });
        }
    }
})
client.login(token);
