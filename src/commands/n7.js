const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// SEUL TOI PEUX UTILISER N7
// ==========================================

const OWNER_ID =
    "811047005513973760";


// ==========================================
// RÔLES
// ==========================================

const ROLES = {

    "👨":
        "1415457997269893261",

    "👩":
        "1415458006149103756",

    "🔞":
        "1415458011136397333",

    "🔰":
        "1415458011832647691",

    "🎮":
        "1415870444023578694"

};


// ==========================================
// COMMANDE N7
// ==========================================

module.exports = {

    name: "7",

    description:
        "Créer le message des rôles.",


    async execute(message) {


        // ======================================
        // VÉRIFICATION PROPRIÉTAIRE
        // ======================================

        if (
            message.author.id !==
            OWNER_ID
        ) {

            return message.reply(
                "❌ Tu n'as pas l'autorisation."
            );

        }


        // ======================================
        // MESSAGE DES RÔLES
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "✨ Choisis tes rôles"
                )

                .setDescription(
`
**Bienvenue sur Nebulae** 💜

Choisis les rôles qui te correspondent en cliquant sur les réactions ci-dessous.

👨 **Homme**
👩 **Femme**
🔞 **Majeur**
🔰 **Mineur**
🎮 **Game**

━━━━━━━━━━━━━━━━━━

💡 Tu peux retirer ta réaction à tout moment pour retirer le rôle.
`
                )

                .setFooter({

                    text:
                        "Nebulae • Rôles"

                })

                .setTimestamp();


        // ======================================
        // ENVOYER LE MESSAGE
        // ======================================

        const roleMessage =
            await message.channel.send({

                embeds: [
                    embed
                ]

            });


        // ======================================
        // AJOUTER LES RÉACTIONS
        // ======================================

        for (
            const emoji of Object.keys(ROLES)
        ) {

            try {

                await roleMessage.react(
                    emoji
                );

            } catch (error) {

                console.error(
                    `❌ Impossible d'ajouter la réaction ${emoji} :`,
                    error
                );

            }

        }


        // ======================================
        // CONFIRMATION
        // ======================================

        return message.reply({

            content:
                "✅ Message des rôles créé !"

        });

    }

};