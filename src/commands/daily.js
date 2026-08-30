const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = {

    name: "daily",

    async execute(message) {

        const file = path.join(__dirname, "..", "data", "economy.json");

        const data = JSON.parse(fs.readFileSync(file, "utf8"));

        const id = message.author.id;

        if (!data[id]) {

            data[id] = {
                money: 500,
                lastDaily: 0
            };

        }

        const now = Date.now();

        const cooldown = 24 * 60 * 60 * 1000;

        if (now - data[id].lastDaily < cooldown) {

            const remaining = cooldown - (now - data[id].lastDaily);

            const hours = Math.floor(remaining / 3600000);

            const minutes = Math.floor((remaining % 3600000) / 60000);

            return message.reply(`⏳ Tu pourras refaire ton daily dans **${hours}h ${minutes}min**.`);
        }

        data[id].money += 500;
        data[id].lastDaily = now;

        fs.writeFileSync(file, JSON.stringify(data, null, 2));

        const embed = new EmbedBuilder()

            .setColor("Green")

            .setTitle("🎁 Daily")

            .setDescription(`Tu viens de recevoir **500 NebuCoins 💎** !`)

            .setFooter({ text: "Nébul • Économie" });

        message.reply({ embeds: [embed] });

    }

};