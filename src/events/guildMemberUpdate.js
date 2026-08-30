const {
    EmbedBuilder
} = require("discord.js");


const BOOST_CHANNEL =
    "1415341178781569084";


module.exports = async (
    client,
    oldMember,
    newMember
) => {

    // ==========================================
    // DÉTECTER UN NOUVEAU BOOST
    // ==========================================

    if (
        oldMember.premiumSince ||
        !newMember.premiumSince
    ) {

        return;

    }


    // ==========================================
    // SALON BOOST
    // ==========================================

    const channel =
        newMember.guild.channels.cache.get(
            BOOST_CHANNEL
        );


    if (!channel) {

        console.error(
            "❌ Salon des boosts introuvable."
        );

        return;

    }


    // ==========================================
    // MESSAGE
    // ==========================================

    const embed =
        new EmbedBuilder()

            .setColor(
                "#FF73FA"
            )

            .setTitle(
                "💜 NOUVEAU BOOST !"
            )

            .setThumbnail(
                newMember.user.displayAvatarURL({
                    dynamic: true,
                    size: 512
                })
            )

            .setDescription(
`
✨ **Un énorme merci à toi ${newMember} !**

🚀 Tu viens de **booster Nebulae** !

Grâce à ton soutien, tu aides directement le serveur à grandir et à débloquer encore plus d'avantages pour la communauté. 💜

━━━━━━━━━━━━━━━━━━

💎 **Merci pour ton soutien !**

🌌 **Nebulae** compte sur toi et apprécie énormément ton geste.

> 🫶 Merci **${newMember.user.username}** pour le boost !
`
            )

            .setFooter({

                text:
                    "Nebulae • Merci pour ton soutien 💜"

            })

            .setTimestamp();


    // ==========================================
    // ENVOYER
    // ==========================================

    try {

        await channel.send({

            content:
                `🎉 ${newMember}`,

            embeds: [
                embed
            ],

            allowedMentions: {

                users: [
                    newMember.id
                ]

            }

        });


        console.log(
            `💜 Nouveau boost : ${newMember.user.tag}`
        );


    } catch (error) {

        console.error(
            "❌ Erreur message boost :",
            error
        );

    }

};