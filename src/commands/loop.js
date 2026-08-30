const {
    toggleLoop
} = require("../services/musicPlayer");

module.exports = {

    name: "loop",

    description: "Active ou désactive la répétition.",

    async execute(message) {

        const enabled =
            toggleLoop(
                message.guild.id
            );


        if (enabled === false) {

            return message.reply(
                "❌ Aucune musique en cours."
            );

        }


        return message.reply(
            enabled
                ? "🔁 Répétition **activée**."
                : "➡️ Répétition **désactivée**."
        );

    }

};