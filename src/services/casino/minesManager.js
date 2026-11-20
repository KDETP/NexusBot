const games = new Map();

function createBoard() {

    const board = Array(16).fill("💎");

    let bombs = 4;

    while (bombs > 0) {

        const index = Math.floor(Math.random() * board.length);

        if (board[index] === "💣") continue;

        board[index] = "💣";

        bombs--;

    }

    return board;

}

module.exports = {

    create(userId, bet) {

        if (games.has(userId)) return false;

        games.set(userId, {

            userId,

            bet,

            multiplier: 1,

            board: createBoard(),

            revealed: []

        });

        return true;

    },

    get(userId) {

        return games.get(userId);

    },

    reveal(userId, index) {

        const game = games.get(userId);

        if (!game) return null;

        if (game.revealed.includes(index))
            return "already";

        game.revealed.push(index);

        if (game.board[index] === "💣")
            return "bomb";

        game.multiplier += 0.25;

        return "diamond";

    },

    cashout(userId) {

        const game = games.get(userId);

        if (!game) return null;

        const win = Math.floor(game.bet * game.multiplier);

        games.delete(userId);

        return win;

    },

    end(userId) {

        games.delete(userId);

    }

};
