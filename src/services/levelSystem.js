const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const profilesPath = path.join(__dirname, "..", "data", "profiles.json");
const economyPath = path.join(__dirname, "..", "data", "economy.json");

const LEVEL_CHANNEL = "1415470522342445099";

const gifs = [
    "https://media.tenor.com/f3kSQ7Dk6O8AAAAC/level-up.gif",
    "https://media.tenor.com/z7Jw9L9Lq3MAAAAC/anime-level-up.gif",
    "https://media.tenor.com/FQ0dCj7M3PkAAAAC/congratulations.gif",
    "https://media.tenor.com/LMR7k0K6QK4AAAAC/power-up.gif"
];

module.exports = {

    async addXP(message) {

        if (!message.guild || message.author.bot) return;

        const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
        const economy = JSON.parse(fs.readFileSync(economyPath, "utf8"));

        const id = message.author.id;

        if (!profiles[id]) {

            profiles[id] = {
                xp: 0,
                level: 1,
                quiz: 0,
                work: 0,
                casino: 0
            };

        }

        if (!economy[id]) {

            economy[id] = {
                money: 500
            };

        }

        // Chaque message rapporte entre 40 et 60 XP
        const gain = Math.floor(Math.random() * 21) + 40;

        profiles[id].xp += gain;

        // Niveau 2 = 500 XP
        // Niveau 3 = 1000 XP
        // Niveau 4 = 1500 XP...
        const xpNeeded = profiles[id].level * 500;

        if (profiles[id].xp >= xpNeeded) {

            profiles[id].xp -= xpNeeded;
            profiles[id].level++;

            economy[id].money += 250;

            const gif = gifs[Math.floor(Math.random() * gifs.length)];

            const embed = new EmbedBuilder()

                .setColor("#8B5CF6")

                .setTitle("🎉 Niveau supérieur !")

                .setDescription(`## Félicitations ${message.author} !

⭐ Tu viens de passer **Niveau ${profiles[id].level}**

💰 Tu gagnes **250 NebuCoins** !

Continue comme ça 🚀`)

                .setImage(gif)

                .setFooter({
                    text: "Nébulae • Système de niveaux"
                })

            const levelChannel = message.guild.channels.cache.get(LEVEL_CHANNEL);

            if (levelChannel) {

                await levelChannel.send({
                    embeds: [embed]
                });

            } else {

                await message.channel.send({
                    embeds: [embed]
                });

            }

        }

        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
        fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

    }

};