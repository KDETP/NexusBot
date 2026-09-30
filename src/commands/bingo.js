const {
    EmbedBuilder
} = require("discord.js");

const rewardsManager =
    require("../services/casino/rewardsManager");


module.exports = {

    name: "bingo",

    async execute(message) {

        const result =
            rewardsManager.playBingo(
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
                        "🎱 BINGO"
                    )

                    .setDescription(
`
⏳ **Le Bingo n'est pas encore disponible.**

Réessaie dans :

> **${rewardsManager.formatTime(result.remaining)}**
`
                    )

                    .setFooter({
                        text:
                            "Nébula • Casino"
                    });

            return message.reply({
                embeds: [
                    embed
                ]
            });

        }


        // ==========================================
        // PAS ASSEZ D'ARGENT
        // ==========================================

        if (
            result.insufficient
        ) {

            return message.reply({
                embeds: [

                    new EmbedBuilder()

                        .setColor("#ED4245")

                        .setTitle(
                            "🎱 BINGO"
                        )

                        .setDescription(
`
❌ Tu n'as pas assez de NebuCoins.

💰 Mise nécessaire : **500**
💳 Ton solde : **${result.balance.toLocaleString("fr-FR")}**
`
                        )

                ]
            });

        }


        // ==========================================
        // RÉSULTAT
        // ==========================================

        let title;
        let color;
        let description;


        if (
            result.reward === 0
        ) {

            title =
                "🎱 BINGO — PERDU";

            color =
                "#ED4245";

            description =
`
💸 Tu as perdu ta mise de **500 NebuCoins**.

🎱 Le tirage n'a rien donné.

💰 Solde :
**${result.balance.toLocaleString("fr-FR")} NebuCoins**
`;

        } else if (
            result.reward ===
            rewardsManager.BINGO_COST
        ) {

            title =
                "🎱 BINGO — REMBOURSÉ";

            color =
                "#FEE75C";

            description =
`
🎉 Tu récupères exactement ta mise !

💎 Gain : **+500 NebuCoins**

💰 Solde :
**${result.balance.toLocaleString("fr-FR")} NebuCoins**
`;

        } else {

            title =
                result.reward >= 2000
                    ? "🎱 BINGO — JACKPOT !"
                    : "🎱 BINGO — GAGNÉ !";

            color =
                result.reward >= 2000
                    ? "#FFD700"
                    : "#57F287";

            description =
`
🎉 **Félicitations !**

💎 Gain : **+${result.reward.toLocaleString("fr-FR")} NebuCoins**

📈 Résultat net :
**${result.profit >= 0 ? "+" : ""}${result.profit.toLocaleString("fr-FR")} NebuCoins**

💰 Solde :
**${result.balance.toLocaleString("fr-FR")} NebuCoins**
`;

        }


        const embed =
            new EmbedBuilder()

                .setColor(color)

                .setTitle(title)

                .setDescription(
                    description
                )

                .setFooter({
                    text:
                        "Nébula • Bingo • Mise : 500"
                })

                .setTimestamp();


        return message.reply({
            embeds: [
                embed
            ]
        });

    }

};