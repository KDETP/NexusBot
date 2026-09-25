const games = new Map();

const RED = new Set([
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25, 27,
    30, 32, 34, 36
]);

function getColor(number) {
    if (number === 0) {
        return "vert";
    }

    return RED.has(number)
        ? "rouge"
        : "noir";
}

function spin() {
    return Math.floor(Math.random() * 37);
}

function isNumberBet(bet) {
    const number = Number(bet);

    return (
        Number.isInteger(number) &&
        number >= 0 &&
        number <= 36 &&
        String(number) === String(bet)
    );
}

function getMultiplier(bet) {

    if (
        bet === "rouge" ||
        bet === "noir" ||
        bet === "pair" ||
        bet === "impair" ||
        bet === "1-18" ||
        bet === "19-36"
    ) {
        return 2;
    }

    if (
        bet === "1-12" ||
        bet === "13-24" ||
        bet === "25-36"
    ) {
        return 3;
    }

    // Numéro exact + vert (0)
    return 36;
}

function isWinningBet(number, bet) {

    const color =
        getColor(number);

    switch (bet) {

        case "rouge":
            return color === "rouge";

        case "noir":
            return color === "noir";

        case "vert":
            return number === 0;

        case "pair":
            return number !== 0 && number % 2 === 0;

        case "impair":
            return number !== 0 && number % 2 === 1;

        case "1-18":
            return number >= 1 && number <= 18;

        case "19-36":
            return number >= 19 && number <= 36;

        case "1-12":
            return number >= 1 && number <= 12;

        case "13-24":
            return number >= 13 && number <= 24;

        case "25-36":
            return number >= 25 && number <= 36;

        default:

            if (isNumberBet(bet)) {
                return Number(bet) === number;
            }

            return false;
    }
}

function getBetLabel(bet) {

    const labels = {

        rouge: "🔴 Rouge",
        noir: "⚫ Noir",
        vert: "🟢 Vert",

        pair: "⚪ Pair",
        impair: "⚫ Impair",

        "1-18": "1–18",
        "19-36": "19–36",

        "1-12": "1ère douzaine",
        "13-24": "2ème douzaine",
        "25-36": "3ème douzaine"

    };

    if (labels[bet]) {
        return labels[bet];
    }

    if (isNumberBet(bet)) {
        return `🎯 Numéro ${bet}`;
    }

    return bet;
}

module.exports = {

    create(userId, amount, bet) {

        const number =
            spin();

        const color =
            getColor(number);

        const win =
            isWinningBet(
                number,
                bet
            );

        const multiplier =
            getMultiplier(
                bet
            );

        const gain =
            win
                ? amount * multiplier
                : 0;

        const game = {

            userId,

            amount,

            bet,

            number,

            color,

            win,

            multiplier,

            gain

        };

        games.set(
            userId,
            game
        );

        return game;
    },

    get(userId) {

        return games.get(
            userId
        );

    },

    end(userId) {

        games.delete(
            userId
        );

    },

    getColor,

    getMultiplier,

    getBetLabel,

    isWinningBet

};