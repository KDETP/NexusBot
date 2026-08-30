const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");

const casinoSessions = require("../services/casino/casinoSessions");

module.exports = {

    name: "casino",

    async execute(message) {

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎰 Casino Nébul")

            .setDescription(
`Bienvenue au Casino !

💰 Gagne des NebuCoins
🎲 Affronte la chance
🏆 Grimpe dans le classement

Choisis un jeu ci-dessous.`
            )

            .setThumbnail(message.guild.iconURL())

            .setFooter({
                text: "Nébul Casino"
            });

        const menu = new StringSelectMenuBuilder()

            .setCustomId("casino_menu")

            .setPlaceholder("🎰 Choisis un jeu...")

            .addOptions([

                {
                    label: "💣 Mines",
                    description: "Trouve les diamants sans exploser.",
                    value: "mines"
                },

                {
                    label: "🃏 Blackjack",
                    description: "Atteins 21 sans dépasser.",
                    value: "blackjack"
                },

                {
                    label: "🎡 Roulette",
                    description: "Rouge, Noir ou Vert.",
                    value: "roulette"
                },

                {
                    label: "🎰 Machine à sous",
                    description: "Décroche le Jackpot.",
                    value: "slots"
                }

            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        const sentMessage = await message.reply({

            embeds: [embed],

            components: [row]

        });

        casinoSessions.create(
            sentMessage.id,
            message.author.id
        );

    }

};