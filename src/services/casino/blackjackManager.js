// ======================================================
// BLACKJACK MANAGER - NÉBUL CASINO
// ======================================================

const games = new Map();

// ======================================================
// DECK
// ======================================================

const SUITS = [
    { symbol: "♠", name: "spades" },
    { symbol: "♥", name: "hearts" },
    { symbol: "♦", name: "diamonds" },
    { symbol: "♣", name: "clubs" }
];

const RANKS = [
    { rank: "A", value: 11 },
    { rank: "2", value: 2 },
    { rank: "3", value: 3 },
    { rank: "4", value: 4 },
    { rank: "5", value: 5 },
    { rank: "6", value: 6 },
    { rank: "7", value: 7 },
    { rank: "8", value: 8 },
    { rank: "9", value: 9 },
    { rank: "10", value: 10 },
    { rank: "J", value: 10 },
    { rank: "Q", value: 10 },
    { rank: "K", value: 10 }
];

function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const card of RANKS) {
            deck.push({
                rank: card.rank,
                value: card.value,
                suit: suit.symbol,
                suitName: suit.name
            });
        }
    }

    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [deck[i], deck[j]] =
            [deck[j], deck[i]];
    }

    return deck;
}

// ======================================================
// VALEUR D'UNE MAIN
// ======================================================

function getValue(hand) {

    let total = 0;
    let aces = 0;

    for (const card of hand) {

        if (card.rank === "A") {
            total += 11;
            aces++;
        } else {
            total += card.value;
        }
    }

    while (
        total > 21 &&
        aces > 0
    ) {
        total -= 10;
        aces--;
    }

    return total;
}

// ======================================================
// BLACKJACK
// ======================================================

function isBlackjack(hand) {
    return (
        hand.length === 2 &&
        getValue(hand) === 21
    );
}

// ======================================================
// CREER UNE PARTIE
// ======================================================

function create(userId, bet) {

    if (games.has(userId)) {
        return null;
    }

    const deck =
        shuffle(createDeck());

    const player = [
        deck.pop(),
        deck.pop()
    ];

    const dealer = [
        deck.pop(),
        deck.pop()
    ];

    const game = {

        userId,

        deck,

        dealer,

        hands: [
            {
                cards: player,
                bet,
                doubled: false,
                stood: false,
                busted: false
            }
        ],

        currentHand: 0,

        split: false,

        finished: false,

        originalBet: bet,

        totalBet: bet,

        createdAt: Date.now()
    };

    games.set(
        userId,
        game
    );

    return game;
}

// ======================================================
// GET
// ======================================================

function get(userId) {
    return games.get(userId);
}

// ======================================================
// MAIN ACTUELLE
// ======================================================

function currentHand(game) {
    return game.hands[
        game.currentHand
    ];
}

// ======================================================
// TIRER
// ======================================================

function hit(userId) {

    const game =
        games.get(userId);

    if (!game || game.finished) {
        return null;
    }

    const hand =
        currentHand(game);

    if (
        hand.stood ||
        hand.busted
    ) {
        return game;
    }

    const card =
        game.deck.pop();

    hand.cards.push(card);

    const total =
        getValue(hand.cards);

    if (total > 21) {
        hand.busted = true;
    }

    return game;
}

// ======================================================
// DOUBLE
// ======================================================

function double(userId) {

    const game =
        games.get(userId);

    if (!game || game.finished) {
        return null;
    }

    const hand =
        currentHand(game);

    if (
        hand.cards.length !== 2 ||
        hand.doubled ||
        hand.stood ||
        hand.busted
    ) {
        return null;
    }

    hand.doubled = true;

    hand.bet *= 2;

    game.totalBet +=
        game.originalBet;

    const card =
        game.deck.pop();

    hand.cards.push(card);

    const total =
        getValue(hand.cards);

    if (total > 21) {
        hand.busted = true;
    }

    hand.stood = true;

    return game;
}

// ======================================================
// SPLIT
// ======================================================

function split(userId) {

    const game =
        games.get(userId);

    if (!game || game.finished) {
        return null;
    }

    if (game.split) {
        return null;
    }

    if (
        game.hands.length !== 1
    ) {
        return null;
    }

    const firstHand =
        game.hands[0];

    if (
        firstHand.cards.length !== 2
    ) {
        return null;
    }

    if (
        firstHand.cards[0].rank !==
        firstHand.cards[1].rank
    ) {
        return null;
    }

    const card1 =
        firstHand.cards[0];

    const card2 =
        firstHand.cards[1];

    game.hands = [

        {
            cards: [
                card1,
                game.deck.pop()
            ],

            bet: game.originalBet,

            doubled: false,

            stood: false,

            busted: false
        },

        {
            cards: [
                card2,
                game.deck.pop()
            ],

            bet: game.originalBet,

            doubled: false,

            stood: false,

            busted: false
        }

    ];

    game.split = true;

    game.currentHand = 0;

    game.totalBet +=
        game.originalBet;

    return game;
}

// ======================================================
// RESTER
// ======================================================

function stand(userId) {

    const game =
        games.get(userId);

    if (!game || game.finished) {
        return null;
    }

    const hand =
        currentHand(game);

    hand.stood = true;

    return game;
}

// ======================================================
// PASSER A LA MAIN SUIVANTE
// ======================================================

function nextHand(userId) {

    const game =
        games.get(userId);

    if (!game || !game.split) {
        return null;
    }

    if (
        game.currentHand >=
        game.hands.length - 1
    ) {
        return null;
    }

    game.currentHand++;

    return game;
}

// ======================================================
// TOUTES LES MAINS TERMINEES
// ======================================================

function allHandsFinished(game) {

    return game.hands.every(
        hand =>
            hand.stood ||
            hand.busted
    );
}

// ======================================================
// JEU DU CROUPIER
// ======================================================

function dealerPlay(userId) {

    const game =
        games.get(userId);

    if (!game) {
        return null;
    }

    while (
        getValue(game.dealer) < 17
    ) {

        game.dealer.push(
            game.deck.pop()
        );
    }

    game.finished = true;

    return game;
}

// ======================================================
// VALEUR
// ======================================================

function value(hand) {

    return getValue(hand);
}

// ======================================================
// BLACKJACK
// ======================================================

function blackjack(hand) {

    return isBlackjack(hand);
}

// ======================================================
// FIN
// ======================================================

function end(userId) {
    games.delete(userId);
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {

    create,

    get,

    hit,

    double,

    split,

    stand,

    nextHand,

    dealerPlay,

    value,

    blackjack,

    allHandsFinished,

    end
};