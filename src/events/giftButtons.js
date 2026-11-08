const {
    EmbedBuilder
} = require("discord.js");

const rewardsManager =
    require("../services/casino/rewardsManager");


module.exports = async (
    client,
    interaction
) => {

    const id =
        interaction.customId;


    // ==========================================
    // IGNORER LES AUTRES BOUTONS
    // ==========================================

    if (
        !id.startsWith("gift_")
    ) {

        return;

    }


    // ==========================================
    // RÉCUPÉRER LES INFORMATIONS
    // ==========================================

    const parts =
        id.split("_");


    const color =
        parts[1];

    const ownerId =
        parts[2];


    // ==========================================
    // EMPÊCHER LES AUTRES JOUEURS
    // ==========================================

    if (
        interaction.user.id !== ownerId
    ) {

        return interaction.reply({

            content:
                "❌ Ce Gift appartient à quelqu'un d'autre.",

            ephemeral:
                true

        });

    }


    // ==========================================
    // RÉSULTAT
    // ==========================================

    const result =
        rewardsManager.openGift(
            interaction.user.id,
            color
        );


    // ==========================================
    // ERREUR / COOLDOWN
    // ==========================================

    if (
        !result.success
    ) {

        if (
            result.cooldown
        ) {

            return interaction.reply({

                content:
                    `⏳ Tu dois attendre encore **${rewardsManager.formatTime(result.remaining)}**.`,

                ephemeral:
                    true

            });

        }


        return interaction.reply({

            content:
                result.error ||
                "❌ Impossible d'ouvrir ce Gift.",

            ephemeral:
                true

        });

    }


    // ==========================================
    // COULEURS AFFICHÉES
    // ==========================================

    const colorEmoji = {

        blue: "🔵",

        green: "🟢",

        red: "🔴"

    };


    const chosenEmoji =
        colorEmoji[
            result.chosenColor
        ];

    const winningEmoji =
        colorEmoji[
            result.winningColor
        ];


    // ==========================================
    // GAGNÉ
    // ==========================================

    if (
        result.won
    ) {

        const isJackpot =
            result.reward >= 1000;


        const embed =
            new EmbedBuilder()

                .setColor(
                    isJackpot
                        ? "#FFD700"
                        : "#57F287"
                )

                .setTitle(
                    isJackpot
                        ? "🎁 GIFT — JACKPOT !"
                        : "🎁 GIFT — GAGNÉ !"
                )

                .setDescription(
`
## ${chosenEmoji} Bon choix !

Ton cadeau contenait :

💎 **+${result.reward.toLocaleString("fr-FR")} NebuCoins**

🎯 Cadeau gagnant :
${winningEmoji}

💰 **Nouveau solde :**
${result.balance.toLocaleString("fr-FR")} NebuCoins
`
                )

                .setFooter({
                    text:
                        "Nébula • Gift"
                })


        return interaction.update({

            embeds: [
                embed
            ],

            components: []

        });

    }


    // ==========================================
    // PERDU
    // ==========================================

    const embed =
        new EmbedBuilder()

            .setColor("#ED4245")

            .setTitle(
                "🎁 GIFT — RATÉ"
            )

            .setDescription(
`
## ${chosenEmoji} Mauvais choix...

Ce cadeau ne contenait rien.

💀 **Récompense : 0 NebuCoins**

🎁 Le cadeau gagnant était :
${winningEmoji}

💰 **Solde :**
${result.balance.toLocaleString("fr-FR")} NebuCoins

Tu pourras retenter ta chance plus tard.
`
            )

            .setFooter({
                text:
                    "Nébula • Gift"
            })


    return interaction.update({

        embeds: [
            embed
        ],

        components: []

    });

};