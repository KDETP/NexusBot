const blackjack = require("../services/casino/blackjackManager");

module.exports = {

    name: "endbj",

    async execute(message) {

        blackjack.end(message.author.id);

        message.reply("✅ Partie Blackjack forcée arrêtée.");

    }

};