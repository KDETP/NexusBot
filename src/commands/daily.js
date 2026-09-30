const {
    EmbedBuilder
} = require("discord.js");

const rewardsManager =
    require("../services/casino/rewardsManager");


module.exports = {

    name: "daily",

    async execute(message) {

        const result =
            rewardsManager.claimDaily(
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
                        "🎁 Daily"
                    )

                    .setDescription(
`
⏳ **Ton Daily n'est pas encore disponible.**

Tu pourras récupérer ta prochaine récompense dans :

> **${rewardsManager.formatTime(result.remaining)}**

🔥 Continue ton streak pour augmenter tes récompenses !
`
                    )

                    .setFooter({
                        text:
                            "Nébula • Économie"
                    });

            return message.reply({
                embeds: [
                    embed
                ]
            });

        }


        // ==========================================
        // SUCCÈS
        // ==========================================

        const reward =
            result.reward;

        const streak =
            result.streak;

        const balance =
            result.balance;


        const embed =
            new EmbedBuilder()

                .setColor("#8B5CF6")

                .setTitle(
                    "🎁 RÉCOMPENSE QUOTIDIENNE"
                )

                .setDescription(
`
✨ **Récompense récupérée !**

💎 **+${reward.toLocaleString("fr-FR")} NebuCoins**

🔥 **Streak :** ${streak} jour${streak > 1 ? "s" : ""}

💰 **Solde :** ${balance.toLocaleString("fr-FR")} NebuCoins

━━━━━━━━━━━━━━━━━━

🎯 Continue demain pour conserver ton streak.
`
                )

                .setFooter({
                    text:
                        "Nébula • Daily"
                })

                .setTimestamp();


        return message.reply({
            embeds: [
                embed
            ]
        });

    }

};