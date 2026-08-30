const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {

    name: "clear",

    aliases: ["purge"],

    async execute(message, args) {

        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("❌ Tu n'as pas la permission.");
        }

        let amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 1000) {
            return message.reply("❌ Utilisation : `nebu clear <1-1000>`");
        }

        let totalDeleted = 0;

        while (amount > 0) {

            const toDelete = Math.min(amount, 100);

            const deleted = await message.channel.bulkDelete(toDelete, true);

            totalDeleted += deleted.size;

            amount -= deleted.size;

            if (deleted.size < toDelete) break;
        }

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🧹 Messages supprimés")
            .setDescription(`✅ **${totalDeleted}** messages ont été supprimés.`)
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

    }

};