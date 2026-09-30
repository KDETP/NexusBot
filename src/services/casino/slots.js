const symbols = Object.freeze([
    { emoji: "🍒", weight: 34, pair: 1.2, triple: 3 },
    { emoji: "🍋", weight: 25, pair: 1.3, triple: 4 },
    { emoji: "🍇", weight: 16, pair: 1.5, triple: 6 },
    { emoji: "🍉", weight: 11, pair: 1.8, triple: 10 },
    { emoji: "🔔", weight: 7, pair: 2.5, triple: 18 },
    { emoji: "💎", weight: 4, pair: 4, triple: 35 },
    { emoji: "⭐", weight: 2, pair: 6, triple: 70 },
    { emoji: "7️⃣", weight: 1, pair: 12, triple: 500 }
]);

const activeGames = new Set();
const totalWeight = symbols.reduce((total, symbol) => total + symbol.weight, 0);

function randomSymbol() {
    let roll = Math.random() * totalWeight;

    for (const symbol of symbols) {
        roll -= symbol.weight;

        if (roll < 0) {
            return symbol;
        }
    }

    return symbols[0];
}

function spin() {
    return [randomSymbol(), randomSymbol(), randomSymbol()];
}

function evaluate(reels, bet) {
    const [first, second, third] = reels;
    const isTriple = first.emoji === second.emoji && second.emoji === third.emoji;

    if (isTriple) {
        const isMegaJackpot = first.emoji === "7️⃣";

        return {
            type: isMegaJackpot ? "megaJackpot" : "jackpot",
            multiplier: first.triple,
            gain: Math.round(bet * first.triple),
            message: isMegaJackpot ? "💥 MÉGA JACKPOT !" : "🎉 JACKPOT !"
        };
    }

    const matchingSymbol = symbols.find(symbol =>
        reels.filter(reel => reel.emoji === symbol.emoji).length === 2
    );

    if (matchingSymbol) {
        return {
            type: "combination",
            multiplier: matchingSymbol.pair,
            gain: Math.round(bet * matchingSymbol.pair),
            message: "✨ Belle combinaison !"
        };
    }

    return {
        type: "loss",
        multiplier: 0,
        gain: 0,
        message: "Les rouleaux ne forment aucune combinaison."
    };
}

module.exports = {
    symbols,
    randomSymbol,
    spin,
    evaluate,

    isActive(userId) {
        return activeGames.has(userId);
    },

    start(userId) {
        if (activeGames.has(userId)) {
            return false;
        }

        activeGames.add(userId);
        return true;
    },

    end(userId) {
        activeGames.delete(userId);
    }
};
