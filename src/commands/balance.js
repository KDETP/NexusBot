const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = {

    name: "balance",
    name: "bal",

    async execute(message) {

        const file = path.join(__dirname, "..", "data", "economy.json");

        const data = JSON.parse(fs.readFileSync(file, "utf8"));

        const id = message.author.id;

        if (!data[id]) {

            data[id] = {
                money: 500
            };

            fs.writeFileSync(file, JSON.stringify(data, null, 2));

        }

        const embed = new EmbedBuilder()

            .setColor("#5865F2")

            .setTitle("💰 Banque Nébulae")

            .setDescription(
                `👤 ${message.author}\n\n💎 **NebuCoins :** ${data[id].money}`
            )

            .setFooter({
                text: "Nébulae • Économie"
            });

        await message.reply({
            embeds: [embed]
        });

    }

};