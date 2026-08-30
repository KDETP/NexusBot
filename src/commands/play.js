const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const {
    playMusic
} = require("../services/musicPlayer");

module.exports = {

    name: "play",

    description:
        "Joue une musique dans un salon vocal.",


    async execute(message, args) {

        const query =
            args.join(" ").trim();


        if (!query) {

            return message.reply(
                "🎵 Utilisation : `nplay <musique>`"
            );

        }


        const voiceChannel =
            message.member.voice.channel;


        if (!voiceChannel) {

            return message.reply(
                "❌ Tu dois être dans un salon vocal."
            );

        }


        const permissions =
            voiceChannel.permissionsFor(
                message.guild.members.me
            );


        if (
            !permissions ||
            !permissions.has("Connect") ||
            !permissions.has("Speak")
        ) {

            return message.reply(
                "❌ Je n'ai pas la permission de rejoindre ou parler dans ce vocal."
            );

        }


        try {

            const result =
                await playMusic(
                    voiceChannel,
                    query,
                    message.author
                );


            const embed =
                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle(
                        "🎵 NebuMusic"
                    )

                    .setDescription(
`
▶️ **Musique ajoutée**

🎶 **${result.track.title}**

👤 Demandée par :
${message.author}

📂 Source :
YouTube
`
                    )

                    .setFooter({

                        text:
                            "Nebulae • NebuMusic"

                    })

                    .setTimestamp();


            if (result.track.thumbnail) {

                embed.setThumbnail(
                    result.track.thumbnail
                );

            }


            // ======================================
            // BOUTONS MUSIQUE
            // ======================================

            const buttons =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                "music_pause"
                            )
                            .setEmoji("⏸️")
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                "music_resume"
                            )
                            .setEmoji("▶️")
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                "music_skip"
                            )
                            .setEmoji("⏭️")
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                "music_loop"
                            )
                            .setEmoji("🔁")
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                "music_stop"
                            )
                            .setEmoji("⏹️")
                            .setStyle(
                                ButtonStyle.Secondary
                            )

                    );


            await message.reply({

                embeds: [
                    embed
                ],

                components: [
                    buttons
                ]

            });


        } catch (error) {

            console.error(
                "\n=============================="
            );

            console.error(
                "❌ ERREUR NEBUMUSIC"
            );

            console.error(
                "=============================="
            );

            console.error(
                error
            );

            console.error(
                "Message :",
                error?.message
            );

            console.error(
                "==============================\n"
            );


            return message.reply(
                "❌ Impossible de lire cette musique. Essaie avec un autre titre."
            );

        }

    }

};