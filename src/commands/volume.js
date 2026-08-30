const {
    setVolume
} = require("../services/musicPlayer");


module.exports = {

    name: "volume",

    description: "Change le volume de la musique.",


    async execute(message, args) {


        const value =
            Number(
                args[0]
            );


        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 300
        ) {

            return message.reply(
                "🔊 Utilisation : `nvolume <0-300>`"
            );

        }



        const success =
            setVolume(
                message.guild.id,
                value
            );



        if (!success) {

            return message.reply(
                "❌ Aucune musique en cours."
            );

        }



        return message.reply(
            `🔊 Volume réglé à **${value}%**.`
        );


    }

};