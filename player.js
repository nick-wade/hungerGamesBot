// Helper Functions for Status Management
function setPlayerStatus(player, status) {
    if (!player.status.includes(status)) {
        player.status.push(status);
    }
}

function removePlayerStatus(player, status) {
    player.status = player.status.filter(s => s !== status);
}

const addPlayerItem = (player, item) => {
    player.items.push(item);
}

function removePlayerItem(player, item){
    player.items = player.items.filter(i => i !== item)
}

function removePlayerAlly(player, allyName) {
    player.allies = player.allies.filter(name => name !== allyName);
}

function addPlayerAlly(player, ally){
    if (!player.allies.includes(ally.name)){
        player.allies.push(ally.name);
    }
}

function addPlayerKills(player, victim){
    if (!player.kills.includes(victim.name)){
        player.kills.push(victim.name);
    }
}

// Factory function to create addPlayerEvent with players dependency
function createPlayerFunctions(players) {
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
    }
    
    return { addPlayerEvent };
}

module.exports = {
    setPlayerStatus,
    removePlayerStatus,
    addPlayerItem,
    removePlayerItem,
    removePlayerAlly,
    addPlayerAlly,
    addPlayerKills,
    createPlayerFunctions
};