const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const rewardsManager =
    require("../services/casino/rewardsManager");


module.exports = {

    name: "gift",

    async execute(message) {

        const result =
            rewardsManager.startGift(
                message.author.id
            );


        // ==========================================
        // COOLDOWN
        // ==========================================

        if (
            result.cooldown
        ) {

            const embed =
                new EmbedBuilder()

                    .setColor("#5865F2")

                    .setTitle(
                        "🎁 GIFT"
                    )

                    .setDescription(
`
⏳ **Tu as déjà ouvert un Gift récemment.**

Tu pourras en choisir un nouveau dans :

> **${rewardsManager.formatTime(result.remaining)}**
`
                    )

                    .setFooter({
                        text:
                            "Nébula • Récompenses"
                    });

            return message.reply({
                embeds: [
                    embed
                ]
            });

        }


        // ==========================================
        // BOUTONS
        // ==========================================

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `gift_blue_${message.author.id}`
                        )

                        .setLabel(
                            "Bleu"
                        )

                        .setEmoji(
                            "🔵"
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `gift_green_${message.author.id}`
                        )

                        .setLabel(
                            "Vert"
                        )

                        .setEmoji(
                            "🟢"
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `gift_red_${message.author.id}`
                        )

                        .setLabel(
                            "Rouge"
                        )

                        .setEmoji(
                            "🔴"
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )

                );


        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor("#8B5CF6")

                .setTitle(
                    "🎁 GIFT"
                )

                .setDescription(
`
## Choisis ton cadeau

Trois cadeaux sont devant toi.

🔵 **Bleu**
🟢 **Vert**
🔴 **Rouge**

Un seul contient une récompense. 👀

**Fais ton choix !**
`
                )

                .setFooter({
                    text:
                        "Nébula • Bonne chance !"
                })


        return message.reply({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });

    }

};