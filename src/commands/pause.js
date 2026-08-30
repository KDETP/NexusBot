const {
    pauseMusic
} = require("../services/musicPlayer");

module.exports = {

    name: "pause",

    description: "Met la musique en pause.",

    async execute(message) {

        const success =
            pauseMusic(
                message.guild.id
            );

        if (!success) {

            return message.reply(
                "❌ Aucune musique n'est en cours."
            );

        }

        return message.reply(
            "⏸️ Musique mise en pause."
        );

    }

};
