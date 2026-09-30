const fs = require("fs");
const path = require("path");

const economyPath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "economy.json"
);


// =====================================================
// CONFIGURATION
// =====================================================

const DAILY_REWARDS = [
    500,
    600,
    700,
    800,
    1000,
    1200,
    1500
];

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

const BINGO_COST = 500;
const BINGO_COOLDOWN = 30 * 60 * 1000;

const GIFT_COOLDOWN = 30 * 60 * 1000;


// =====================================================
// ECONOMY
// =====================================================

function loadEconomy() {

    if (!fs.existsSync(economyPath)) {

        fs.writeFileSync(
            economyPath,
            "{}"
        );

    }

    try {

        return JSON.parse(
            fs.readFileSync(
                economyPath,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ Impossible de lire economy.json :",
            error
        );

        return {};

    }

}


function saveEconomy(data) {

    fs.writeFileSync(
        economyPath,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


function getUser(data, userId) {

    if (!data[userId]) {

        data[userId] = {
            money: 500
        };

    }

    if (
        typeof data[userId].money !== "number"
    ) {

        data[userId].money = 500;

    }

    return data[userId];

}


// =====================================================
// TEMPS
// =====================================================

function getRemaining(timestamp, cooldown) {

    if (!timestamp) {
        return 0;
    }

    const remaining =
        cooldown -
        (Date.now() - timestamp);

    return Math.max(
        0,
        remaining
    );

}


function formatTime(ms) {

    const totalMinutes =
        Math.ceil(ms / 60000);

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    if (hours > 0) {

        return `${hours}h ${minutes}min`;

    }

    return `${minutes}min`;

}


// =====================================================
// DAILY
// =====================================================

function claimDaily(userId) {

    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    const now =
        Date.now();

    const lastDaily =
        user.lastDaily || 0;

    const elapsed =
        now - lastDaily;


    // -------------------------------------------------
    // COOLDOWN
    // -------------------------------------------------

    if (
        lastDaily &&
        elapsed < DAILY_COOLDOWN
    ) {

        return {

            success: false,

            cooldown: true,

            remaining:
                DAILY_COOLDOWN -
                elapsed

        };

    }


    // -------------------------------------------------
    // STREAK
    // -------------------------------------------------

    let streak =
        Number(
            user.dailyStreak || 0
        );


    /*
     * Si plus de 48h se sont écoulées,
     * le streak repart à 1.
     *
     * On laisse une fenêtre de tolérance
     * pour éviter de casser le streak
     * à cause de quelques heures de retard.
     */

    if (
        lastDaily &&
        elapsed > DAILY_COOLDOWN * 2
    ) {

        streak = 0;

    }


    streak++;


    if (
        streak > DAILY_REWARDS.length
    ) {

        streak =
            DAILY_REWARDS.length;

    }


    const reward =
        DAILY_REWARDS[
            streak - 1
        ];


    user.money += reward;

    user.lastDaily =
        now;

    user.dailyStreak =
        streak;


    saveEconomy(
        data
    );


    return {

        success: true,

        reward,

        streak,

        balance:
            user.money,

        nextReward:
            DAILY_REWARDS[
                Math.min(
                    streak,
                    DAILY_REWARDS.length - 1
                )
            ]

    };

}


// =====================================================
// BINGO
// =====================================================

function playBingo(userId) {

    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    const now =
        Date.now();

    const lastBingo =
        user.lastBingo || 0;


    // -------------------------------------------------
    // COOLDOWN
    // -------------------------------------------------

    if (
        lastBingo &&
        now - lastBingo < BINGO_COOLDOWN
    ) {

        return {

            success: false,

            cooldown: true,

            remaining:
                BINGO_COOLDOWN -
                (now - lastBingo)

        };

    }


    // -------------------------------------------------
    // SOLDE
    // -------------------------------------------------

    if (
        user.money < BINGO_COST
    ) {

        return {

            success: false,

            insufficient: true,

            balance:
                user.money

        };

    }


    // -------------------------------------------------
    // RETRAIT DE LA MISE
    // -------------------------------------------------

    user.money -=
        BINGO_COST;


    /*
     * Tableau de probabilités :
     *
     * 0 - 34.99% = 0
     * 35 - 64.99% = 500
     * 65 - 84.99% = 750
     * 85 - 94.99% = 1000
     * 95 - 98.99% = 2000
     * 99 - 99.99% = 5000
     */

    const roll =
        Math.random() * 100;

    let reward = 0;

    if (roll < 35) {

        reward = 0;

    } else if (roll < 65) {

        reward = 500;

    } else if (roll < 85) {

        reward = 750;

    } else if (roll < 95) {

        reward = 1000;

    } else if (roll < 99) {

        reward = 2000;

    } else {

        reward = 5000;

    }


    // -------------------------------------------------
    // GAIN
    // -------------------------------------------------

    user.money +=
        reward;

    user.lastBingo =
        now;


    saveEconomy(
        data
    );


    return {

        success: true,

        cost:
            BINGO_COST,

        reward,

        profit:
            reward - BINGO_COST,

        balance:
            user.money

    };

}


// =====================================================
// GIFT
// =====================================================

function startGift(userId) {

    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    const now =
        Date.now();

    const lastGift =
        user.lastGift || 0;


    // -------------------------------------------------
    // COOLDOWN
    // -------------------------------------------------

    if (
        lastGift &&
        now - lastGift < GIFT_COOLDOWN
    ) {

        return {

            success: false,

            cooldown: true,

            remaining:
                GIFT_COOLDOWN -
                (now - lastGift)

        };

    }


    return {

        success: true

    };

}


// =====================================================
// GIFT - RÉSULTAT
// =====================================================

function openGift(userId, chosenColor) {

    const validColors = [
        "blue",
        "green",
        "red"
    ];


    if (
        !validColors.includes(
            chosenColor
        )
    ) {

        return {

            success: false,

            error: "Cadeau invalide."

        };

    }


    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    const now =
        Date.now();

    const lastGift =
        user.lastGift || 0;


    // -------------------------------------------------
    // VÉRIFICATION COOLDOWN
    // -------------------------------------------------

    if (
        lastGift &&
        now - lastGift < GIFT_COOLDOWN
    ) {

        return {

            success: false,

            cooldown: true,

            remaining:
                GIFT_COOLDOWN -
                (now - lastGift)

        };

    }


    // -------------------------------------------------
    // CHOIX DU CADEAU GAGNANT
    // -------------------------------------------------

    const colors = [
        "blue",
        "green",
        "red"
    ];

    const winningColor =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];


    let reward = 0;


    // -------------------------------------------------
    // SI LE JOUEUR GAGNE
    // -------------------------------------------------

    if (
        chosenColor ===
        winningColor
    ) {

        const roll =
            Math.random() * 100;


        if (roll < 40) {

            reward = 100;

        } else if (roll < 70) {

            reward = 250;

        } else if (roll < 88) {

            reward = 500;

        } else if (roll < 97) {

            reward = 750;

        } else {

            reward = 1500;

        }


        user.money +=
            reward;

    }


    user.lastGift =
        now;


    saveEconomy(
        data
    );


    return {

        success: true,

        chosenColor,

        winningColor,

        reward,

        won:
            reward > 0,

        balance:
            user.money

    };

}


module.exports = {

    DAILY_REWARDS,

    DAILY_COOLDOWN,

    BINGO_COST,

    BINGO_COOLDOWN,

    GIFT_COOLDOWN,

    claimDaily,

    playBingo,

    startGift,

    openGift,

    formatTime,

    getRemaining

};