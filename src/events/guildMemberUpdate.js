const {
    EmbedBuilder
} = require("discord.js");


// =========================================================
// CONFIG
// =========================================================

const BOOST_CHANNEL = "1415341178781569084";


// =========================================================
// EVENT
// =========================================================

module.exports = async (
    client,
    oldMember,
    newMember
) => {

    try {

        // =====================================================
        // NOUVEAU BOOST UNIQUEMENT
        // =====================================================

        const wasBoosting =
            oldMember.premiumSince !== null;

        const isBoosting =
            newMember.premiumSince !== null;


        // Pas un nouveau boost
        if (
            wasBoosting ||
            !isBoosting
        ) {
            return;
        }


        console.log(
            `💜 Nouveau boost détecté : ${newMember.user.tag}`
        );


        // =====================================================
        // CHANNEL
        // =====================================================

        const channel =
            await newMember.guild.channels.fetch(
                BOOST_CHANNEL
            ).catch(
                () => null
            );


        if (!channel) {

            console.error(
                `❌ Salon boost introuvable : ${BOOST_CHANNEL}`
            );

            return;
        }


        // =====================================================
        // EMBED
        // =====================================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#FF73FA"
                )

                .setAuthor({
                    name:
                        `${newMember.user.username} a boosté Nébulae`,
                    iconURL:
                        newMember.user.displayAvatarURL({
                            size: 256
                        })
                })

                .setDescription(
                    `💜 **Merci ${newMember} !**\n\n` +
                    `Ton boost aide directement **Nébulae**. 🚀`
                )

                .setThumbnail(
                    newMember.user.displayAvatarURL({
                        size: 512
                    })
                )

                .setFooter({
                    text:
                        "Nébulae • Nouveau boost"
                })


        // =====================================================
        // ENVOI
        // =====================================================

        await channel.send({

            content:
                `${newMember}`,

            embeds: [
                embed
            ],

            allowedMentions: {
                users: [
                    newMember.id
                ]
            }

        });


        // =====================================================
        // LOG
        // =====================================================

        console.log(
            `✅ Message de boost envoyé pour ${newMember.user.tag}`
        );


    } catch (error) {

        console.error(
            "❌ Erreur système boost :",
            error
        );

    }

};