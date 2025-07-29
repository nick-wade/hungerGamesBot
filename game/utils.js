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

module.exports = {
    probabilities,
    getRandInt,
    selectRandomLimb,
    handleProbability
};
