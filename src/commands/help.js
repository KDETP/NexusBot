const { sendPublicCommandHelp } = require("../utils/commandHelp");

module.exports = {
    name: "aide",
    description: "Afficher les commandes publiques du bot.",

    async execute(message) {
        return sendPublicCommandHelp(message);
    }
};
