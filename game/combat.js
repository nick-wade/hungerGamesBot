const { selectRandomLimb } = require('./game/utils');
const { setPlayerStatus, addPlayerKills, removePlayerItem } = require('./game/player');

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

module.exports = {
    hatchet,
    knife,
    explosives,
    fists,
    molotov,
    bow
};