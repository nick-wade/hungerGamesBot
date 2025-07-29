const { selectRandomLimb } = require('./utils');
const { setPlayerStatus, addPlayerKills, removePlayerItem, addPlayerRival } = require('./player');

// Helper function to handle rival creation when victim dies
function handleVictimDeath(player, victim, players) {
    setPlayerStatus(victim, 'Deceased');
    addPlayerKills(player, victim);
    
    // If victim has allies, make them rivals of the killer
    if (victim.allies && victim.allies.length > 0) {
        victim.allies.forEach(allyName => {
            const ally = players[allyName];
            if (ally && !ally.status.includes('Deceased')) {
                addPlayerRival(ally, player);
            }
        });
    }
}

const hatchet = (player, victim, type, players) => {
    let eventMessage;
    switch(type){
        case "decapitate":
            eventMessage = `**${player.name}** decapitated **${victim.name}** with a hatchet.`;
            handleVictimDeath(player, victim, players);
            break;
        default:
            eventMessage = `**${player.name}** mutilated **${victim.name}** with a hatchet.`
            handleVictimDeath(player, victim, players);
            break;
    }
    return eventMessage;
}

const knife = (player, victim, type, players) => {
    let eventMessage;
    switch(type){
        case "heart":
            eventMessage = `**${player.name}** stabbed **${victim.name}** in the heart a knife.`;
            handleVictimDeath(player, victim, players);
            break;
        case "throat":
            eventMessage = `**${player.name}** slit **${victim.name}**'s throat with a knife.`;
            handleVictimDeath(player, victim, players);
            break;
        default:
            eventMessage = `**${player.name}** stabbed **${victim.name}** to death with a knife.`;
            handleVictimDeath(player, victim, players);
            break;
            
    };
    return eventMessage;
};

const explosives = (player, victim, type, players) => {
    let eventMessage
    switch(type){
        case "detonate":
            eventMessage = `**${player.name}** detonates explosives, killing **${victim.name}** in the blast.`;
            handleVictimDeath(player, victim, players);
            break;
        default:
            eventMessage = `**${player.name}** uses explosives to kill **${victim.name}**`;
            handleVictimDeath(player, victim, players);
            break;
    };
    return eventMessage;
};

const fists = (player, victim, type, players) => {
    let eventMessage;
    
    // Check if this is a revenge fight (either player is rival of the other)
    const isRevenge = player.rivals.includes(victim.name) || victim.rivals.includes(player.name);
    
    // Determine win chance based on health status
    let playerWinChance = 0.5; // Base 50/50
    
    if (player.status.includes('sick') && !victim.status.includes('sick')) {
        playerWinChance = 0.3; // 30% if player is sick
    } else if (!player.status.includes('sick') && victim.status.includes('sick')) {
        playerWinChance = 0.7; // 70% if victim is sick
    }
    
    const playerWins = Math.random() < playerWinChance;
    
    if (playerWins) {
        // Player wins the fight
        switch(type){
            case "beat":
                if (isRevenge) {
                    eventMessage = `**${player.name}** gets their revenge and brutally beats **${victim.name}** to death!`;
                } else {
                    eventMessage = `**${player.name}** murked **${victim.name}**, killing them.`;
                }
                break;
            case "overpower":
                if (isRevenge) {
                    eventMessage = `**${player.name}** overpowers **${victim.name}** in a revenge-fueled rage, smashing their head into a tree repeatedly!`;
                } else {
                    eventMessage = `**${player.name}** smashed **${victim.name}**'s head into a tree repeatedly, killing them.`;
                }
                break;
            case "strangulate":
                if (isRevenge) {
                    eventMessage = `**${player.name}** strangles **${victim.name}** to death, whispering "This is for what you did."`;
                } else {
                    eventMessage = `**${player.name}** strangles and chokes **${victim.name}** to death.`;
                }
                break;
            case "neckSnap":
                if (isRevenge) {
                    eventMessage = `**${player.name}** snaps **${victim.name}**'s neck in one swift motion, avenging their fallen ally.`;
                } else {
                    eventMessage = `**${player.name}** breaks **${victim.name}**'s neck.`;
                }
                break;
            default:
                if (isRevenge) {
                    eventMessage = `**${player.name}** beats **${victim.name}** to death in an act of revenge!`;
                } else {
                    eventMessage = `**${player.name}** beats **${victim.name}** to death.`;
                }
                break;
        }
        handleVictimDeath(player, victim, players);
    } else {
        // Victim wins the fight (turns the tables)
        switch(type){
            case "beat":
                if (isRevenge) {
                    eventMessage = `**${player.name}** tries to get revenge on **${victim.name}**, but **${victim.name}** turns the tables and beats **${player.name}** to death instead!`;
                } else {
                    eventMessage = `**${player.name}** attacks **${victim.name}**, but **${victim.name}** fights back and kills **${player.name}**!`;
                }
                break;
            case "overpower":
                if (isRevenge) {
                    eventMessage = `**${player.name}** tries to overpower **${victim.name}** for revenge, but **${victim.name}** counters and smashes **${player.name}**'s head into a tree!`;
                } else {
                    eventMessage = `**${player.name}** tries to overpower **${victim.name}**, but **${victim.name}** fights back and kills **${player.name}**!`;
                }
                break;
            case "strangulate":
                if (isRevenge) {
                    eventMessage = `**${player.name}** tries to strangle **${victim.name}** in revenge, but **${victim.name}** breaks free and strangles **${player.name}** instead!`;
                } else {
                    eventMessage = `**${player.name}** tries to strangle **${victim.name}**, but **${victim.name}** fights back and strangles **${player.name}**!`;
                }
                break;
            case "neckSnap":
                if (isRevenge) {
                    eventMessage = `**${player.name}** goes for **${victim.name}**'s neck seeking revenge, but **${victim.name}** counters and snaps **${player.name}**'s neck instead!`;
                } else {
                    eventMessage = `**${player.name}** tries to break **${victim.name}**'s neck, but **${victim.name}** counters and breaks **${player.name}**'s neck!`;
                }
                break;
            default:
                if (isRevenge) {
                    eventMessage = `**${player.name}** attacks **${victim.name}** seeking revenge, but **${victim.name}** overpowers and kills **${player.name}**!`;
                } else {
                    eventMessage = `**${player.name}** attacks **${victim.name}**, but **${victim.name}** fights back and kills **${player.name}**!`;
                }
                break;
        }
        handleVictimDeath(victim, player, players); // Note: victim kills player
    }
    
    return eventMessage;
};

const molotov = (player, victim, type, players) => {
    let eventMessage;
    switch(type){
        case "throw":
            eventMessage = `**${player.name}** hurls a molotov at **${victim.name}**, leaving them wit third degree burns.`
            handleVictimDeath(player, victim, players);
            break;
        case "miss":
            eventMessage = `**${player.name}** tries to throw a molotov at **${victim.name}**, but it slips out of his hand. **${player.name}** promptly set on fire and died.`
            setPlayerStatus(player, 'Deceased');
            break;
        default:
            eventMessage = `**${player.name}** wants to kill someone with a molotov.`
            break;
    }
    return eventMessage
}

const bow = (player, victim, type, players) => {
    let eventMessage;
    switch(type){
        case "hit_heart":
            eventMessage = `**${player.name}** shot a bow at **${victim.name}** and hit their heart, stopping it.`;
            handleVictimDeath(player, victim, players);
            removePlayerItem(player, 'bow');
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

module.exports = {
    hatchet,
    knife,
    explosives,
    fists,
    molotov,
    bow
};