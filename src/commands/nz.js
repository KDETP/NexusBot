const { sendPublicCommandHelp } = require("../utils/commandHelp");

module.exports = {
    name: "z",
    description: "Recevoir l'aide des commandes publiques en message privé.",

    async execute(message) {
        return sendPublicCommandHelp(message, { directMessage: true });
    }
};
