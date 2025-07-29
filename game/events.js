const { getRandInt, handleProbability } = require('./utils');
const { setPlayerStatus, addPlayerItem, removePlayerItem, removePlayerStatus, addPlayerAlly } = require('./player');

// Tree Climbing Event Handler
const handleTreeEvent = (player) => {
    const outcome = handleProbability('tree');
    let eventMessage = '';

    switch (outcome) {
        case 'fall_and_die':
            eventMessage = `**${player.name}** climbs a tree to hide but falls out and dies.`;
            setPlayerStatus(player, 'Deceased');
            break;
        case 'stay_night':
            eventMessage = `**${player.name}** climbs a tree and stays there for the night.`;
            player.activity = null;
            break;
        case 'find_fruits':
            eventMessage = `**${player.name}** climbs a tree and finds fruits.`;
            player.items.push('fruits');
            player.activity = null;
            break;
        default:
            eventMessage = `**${player.name}** did something unexpected in the tree.`;
            player.activity = null;
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
            setPlayerStatus(player, 'Deceased');
            break;
        case 'sick':
            eventMessage = `**${player.name}** ate a poisonous berry and is now sick.`;
            setPlayerStatus(player, 'sick');
            break;
        default:
            eventMessage = `**${player.name}** had an unexpected reaction to the berry.`;
            setPlayerStatus(player, 'sick');
    }

    return eventMessage;
};
const handleRivalEvent = (player, rival) => {

}

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

module.exports = {
    handleTreeEvent,
    handleBerryEvent,
    handleStealEvent,
    handleSponsorEvent,
    handleRivalEvent,
    handleSick,
    handleAlly
};