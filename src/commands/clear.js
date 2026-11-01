const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "clear",
    aliases: ["purge"],

    async execute(message, args) {
        if (!message.guild || !message.member) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("Tu n'as pas la permission.");
        }

        const amount = Number.parseInt(args[0], 10);

        if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
            return message.reply("Utilisation : `npurge <1-1000>`");
        }

        const botMember = message.guild.members.me;
        const botPermissions = message.channel.permissionsFor(botMember);

        if (
            !botPermissions ||
            !botPermissions.has(PermissionFlagsBits.ViewChannel) ||
            !botPermissions.has(PermissionFlagsBits.ReadMessageHistory) ||
            !botPermissions.has(PermissionFlagsBits.ManageMessages) ||
            !botPermissions.has(PermissionFlagsBits.SendMessages)
        ) {
            return message.reply(
                "Je dois avoir les permissions Voir le salon, Voir l'historique, Gerer les messages et Envoyer des messages."
            );
        }

        let remaining = amount;
        let totalDeleted = 0;
        let beforeId = message.id;

        try {
            // Supprime le nombre demande de messages au-dessus de la commande.
            // Le message contenant la commande sera supprime separement.
            while (remaining > 0) {
                const batchSize = Math.min(remaining, 100);

                const fetched = await message.channel.messages.fetch({
                    limit: batchSize,
                    before: beforeId
                });

                if (fetched.size === 0) break;

                beforeId = fetched.last().id;

                // Les messages de plus de 14 jours sont ignores par Discord.
                const deleted = await message.channel.bulkDelete(fetched, true);

                totalDeleted += deleted.size;
                remaining -= deleted.size;

                if (fetched.size < batchSize) break;
            }

            // Supprime toujours le message contenant npurge, en plus du nombre demande.
            await message.delete().catch(() => {});

            const embed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("Messages supprimés")
                .setDescription(
                    `✅ **${totalDeleted}** message(s) au-dessus supprimé(s).\n` +
                    "Le message de commande a également été supprimé."
                )
                .setFooter({
                    text: "Nébul • Modération"
                })
                .setTimestamp();

            const confirm = await message.channel.send({
                embeds: [embed]
            });

            setTimeout(() => {
                confirm.delete().catch(() => {});
            }, 3000);

        } catch (error) {
            console.error("Erreur commande clear :", error);

            await message.delete().catch(() => {});

            return message.channel.send(
                "Une erreur est survenue pendant la suppression des messages."
            );
        }
    }
};