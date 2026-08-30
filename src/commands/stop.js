const {
    stopMusic
} = require("../services/musicPlayer");

module.exports = {

    name: "stop",

    description: "Arrête la musique et vide la file.",

    async execute(message) {

        const success =
            stopMusic(
                message.guild.id
            );

        if (!success) {

            return message.reply(
                "❌ Aucune musique en cours."
            );

        }

        return message.reply(
            "⏹️ Musique arrêtée et file d'attente vidée."
        );

    }

};