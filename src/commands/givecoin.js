const {
    EmbedBuilder
} = require("discord.js");

const rewardsManager =
    require("../services/casino/rewardsManager");


module.exports = {

    name: "give",

    description:
        "Donner des NebuCoins à un membre avec son ID ou une mention.",


    async execute(message, args) {

        // ==========================================
        // DESTINATAIRE : MENTION OU ID
        // ==========================================

        let targetId;

        const mentionedUser =
            message.mentions.users.first();

        if (mentionedUser) {

            targetId =
                mentionedUser.id;

        } else {

            targetId =
                args[0];

        }


        if (!targetId) {

            return message.reply(
                "❌ Utilisation : `ngive @user montant` ou `ngive ID_du_user montant`"
            );

        }


        // ==========================================
        // VÉRIFICATION DE L'ID
        // ==========================================

        if (
            !/^\d{17,20}$/.test(targetId)
        ) {

            return message.reply(
                "❌ L'ID de l'utilisateur est invalide."
            );

        }


        // ==========================================
        // MONTANT
        // ==========================================

        // Avec une mention : ngive @user 5000
        // Avec un ID     : ngive 123456789 5000

        const amountArg =
            mentionedUser
                ? args[1]
                : args[1];


        const amount =
            Number(amountArg);


        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {

            return message.reply(
                "❌ Utilisation : `ngive @user montant` ou `ngive ID_du_user montant`"
            );

        }


        // ==========================================
        // EMPÊCHER DE SE DONNER À SOI-MÊME
        // ==========================================

        if (
            targetId ===
            message.author.id
        ) {

            return message.reply(
                "❌ Tu ne peux pas te donner des NebuCoins à toi-même."
            );

        }


        // ==========================================
        // RÉCUPÉRER L'UTILISATEUR
        // ==========================================

        let target;

        try {

            target =
                await message.client.users.fetch(
                    targetId
                );

        } catch {

            return message.reply(
                "❌ Aucun utilisateur avec cet ID n'a été trouvé."
            );

        }


        // ==========================================
        // BOT
        // ==========================================

        if (
            target.bot
        ) {

            return message.reply(
                "❌ Tu ne peux pas donner des NebuCoins à un bot."
            );

        }


        // ==========================================
        // TRANSFERT
        // ==========================================

        const result =
            rewardsManager.giveMoney(
                message.author.id,
                target.id,
                amount
            );


        if (
            !result.success
        ) {

            if (
                result.insufficient
            ) {

                return message.reply(
                    `❌ Tu n'as pas assez de NebuCoins.\n\n💰 Solde : **${result.balance.toLocaleString("fr-FR")}**\n💸 Demande : **${amount.toLocaleString("fr-FR")}**`
                );

            }


            return message.reply(
                result.error
            );

        }


        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#57F287"
                )

                .setTitle(
                    "💸 Transfert effectué"
                )

                .setDescription(
`
👤 **Donneur**
${message.author}

🎁 **Destinataire**
${target}

🆔 \`${target.id}\`

━━━━━━━━━━━━━━━━━━

💰 **Montant envoyé**
**${result.amount.toLocaleString("fr-FR")} NebuCoins**

🧾 **Taxe**
**${result.tax.toLocaleString("fr-FR")} NebuCoins**
(${(result.taxRate * 100).toFixed(1)}%)

💎 **Montant reçu**
**${result.received.toLocaleString("fr-FR")} NebuCoins**

━━━━━━━━━━━━━━━━━━

💳 **Ton nouveau solde**
**${result.senderBalance.toLocaleString("fr-FR")} NebuCoins**
`
                )

                .setFooter({
                    text:
                        "Nébula • Transfert"
                })

                .setTimestamp();


        return message.reply({

            embeds: [
                embed
            ]

        });

    }

};