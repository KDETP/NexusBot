const {
    skipMusic
} = require("../services/musicPlayer");

module.exports = {

    name: "skip",

    description: "Passe à la musique suivante.",

    async execute(message) {

        const success =
            skipMusic(
                message.guild.id
            );

        if (!success) {

            return message.reply(
                "❌ Aucune musique en cours."
            );

        }

        return message.reply(
            "⏭️ Musique passée !"
        );

    }

};