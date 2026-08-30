const games = new Map();

function getColor(number) {
    if (number === 0) return "vert";

    const red = [
        1,3,5,7,9,
        12,14,16,18,
        19,21,23,25,27,
        30,32,34,36
    ];

    return red.includes(number)
        ? "rouge"
        : "noir";
}

function spin() {
    return Math.floor(Math.random() * 37);
}

function multiplier(bet) {

    if (
        bet === "rouge" ||
        bet === "noir" ||
        bet === "pair" ||
        bet === "impair" ||
        bet === "1-18" ||
        bet === "19-36"
    ) return 2;

    if (
        bet === "1-12" ||
        bet === "13-24" ||
        bet === "25-36"
    ) return 3;

    return 36;
}

function isWin(number, bet) {

    const color = getColor(number);

    if (bet === "rouge")
        return color === "rouge";

    if (bet === "noir")
        return color === "noir";

    if (bet === "vert")
        return number === 0;

    if (bet === "pair")
        return number !== 0 && number % 2 === 0;

    if (bet === "impair")
        return number % 2 === 1;

    if (bet === "1-18")
        return number >= 1 && number <= 18;

    if (bet === "19-36")
        return number >= 19 && number <= 36;

    if (bet === "1-12")
        return number >= 1 && number <= 12;

    if (bet === "13-24")
        return number >= 13 && number <= 24;

    if (bet === "25-36")
        return number >= 25 && number <= 36;

    if (!isNaN(bet))
        return Number(bet) === number;

    return false;
}

module.exports = {

    create(userId, amount, bet) {

        const number = spin();

        const color = getColor(number);

        const win = isWin(number, bet);

        const gain = win
            ? amount * multiplier(bet)
            : 0;

        const game = {

            userId,

            amount,

            bet,

            number,

            color,

            win,

            gain

        };

        games.set(userId, game);

        return game;

    },

    get(userId) {

        return games.get(userId);

    },

    end(userId) {

        games.delete(userId);

    }

};