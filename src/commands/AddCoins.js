const fs = require("fs");
const path = require("path");

const CROWN_ROLE_ID =
    "1457855405370900662";

module.exports = {

    name: "addcoins",
    name: "addc",
    
    async execute(message, args) {

        // ==========================================
        // SERVEUR UNIQUEMENT
        // ==========================================

        if (!message.guild) {
            return message.reply(
                "❌ Cette commande fonctionne uniquement sur un serveur."
            );
        }

        // ==========================================
        // COURONNE UNIQUEMENT
        // ==========================================

        if (
            !message.member.roles.cache.has(
                CROWN_ROLE_ID
            )
        ) {
            return message.reply(
                "👑 **Accès refusé.** Cette commande est réservée à la Couronne."
            );
        }

        // ==========================================
        // UTILISATEUR
        // ==========================================

        const target =
            message.mentions.users.first();

        if (!target) {
            return message.reply(
                "❌ Utilisation : `naddcoins @user montant`"
            );
        }

        // ==========================================
        // MONTANT
        // ==========================================

        const amount =
            Number(args[1]);

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0
        ) {
            return message.reply(
                "❌ Le montant doit être un nombre entier supérieur à 0."
            );
        }

        // ==========================================
        // FICHIER ECONOMIE
        // ==========================================

        const file =
            path.join(
                __dirname,
                "..",
                "data",
                "economy.json"
            );

        let data;

        try {

            data =
                JSON.parse(
                    fs.readFileSync(
                        file,
                        "utf8"
                    )
                );

        } catch (error) {

            console.error(
                "❌ Erreur economy.json :",
                error
            );

            return message.reply(
                "❌ Impossible de lire l'économie."
            );
        }

        // ==========================================
        // CREATION DU COMPTE SI NECESSAIRE
        // ==========================================

        if (!data[target.id]) {

            data[target.id] = {
                money: 500
            };
        }

        // ==========================================
        // AJOUT
        // ==========================================

        data[target.id].money +=
            amount;

        // ==========================================
        // SAUVEGARDE
        // ==========================================

        try {

            fs.writeFileSync(
                file,
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

        } catch (error) {

            console.error(
                "❌ Erreur sauvegarde économie :",
                error
            );

            return message.reply(
                "❌ Impossible de sauvegarder le nouveau solde."
            );
        }

        // ==========================================
        // CONFIRMATION
        // ==========================================

        const newBalance =
            data[target.id].money;

        return message.reply(
            `👑 **Gestion économique**\n\n` +
            `👤 Utilisateur : ${target}\n` +
            `💰 Ajout : **+${amount.toLocaleString("fr-FR")} NebuCoins**\n` +
            `💳 Nouveau solde : **${newBalance.toLocaleString("fr-FR")} NebuCoins**`
        );
    }
};