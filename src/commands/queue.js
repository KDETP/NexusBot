const {
    EmbedBuilder
} = require("discord.js");

const {
    getQueue
} = require("../services/musicPlayer");

module.exports = {

    name: "queue",

    description: "Affiche la file d'attente.",

    async execute(message) {

        const data =
            getQueue(
                message.guild.id
            );


        if (
            !data.current &&
            !data.queue.length
        ) {

            return message.reply(
                "📭 La file d'attente est vide."
            );

        }


        let description = "";


        if (data.current) {

            description +=
                `🎵 **En cours :** ${data.current.title}\n\n`;

        }


        if (data.queue.length) {

            description +=
                "📋 **À venir :**\n";


            data.queue
                .slice(0, 10)
                .forEach(
                    (track, index) => {

                        description +=
                            `**${index + 1}.** ${track.title}\n`;

                    }
                );


            if (data.queue.length > 10) {

                description +=
                    `\n... et ${data.queue.length - 10} autre(s).`;

            }

        }


        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎵 NebuMusic • File d'attente"
                )

                .setDescription(
                    description
                )

                .setFooter({

                    text:
                        "Nebulae • NebuMusic"

                })

                .setTimestamp();


        return message.reply({

            embeds: [
                embed
            ]

        });

    }

};