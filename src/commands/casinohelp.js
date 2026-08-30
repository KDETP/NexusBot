const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

module.exports = {

    name: "casinohelp",

    async execute(message) {

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎰 Guide du Casino Nébul")

            .setDescription(`Bienvenue !

Choisis un jeu ci-dessous pour apprendre les règles, les gains et les astuces.

📖 Tous les jeux sont expliqués en détail.`)

            .setFooter({
                text: "Nébul Casino"
            });

        const menu = new StringSelectMenuBuilder()

            .setCustomId("casino_help")

            .setPlaceholder("📚 Choisis un jeu...")

            .addOptions([

                {
                    label: "💣 Mines",
                    value: "mines",
                    description: "Comment jouer à Mines"
                },

                {
                    label: "🃏 Blackjack",
                    value: "blackjack",
                    description: "Comment jouer au Blackjack"
                },

                {
                    label: "🎰 Machine à sous",
                    value: "slots",
                    description: "Comment jouer aux Slots"
                },

                {
                    label: "🎡 Roulette",
                    value: "roulette",
                    description: "Comment jouer à la Roulette"
                },

                {
                    label: "🪙 Pile ou Face",
                    value: "coinflip",
                    description: "Comment jouer au CoinFlip"
                },

                {
                    label: "🎲 Dés",
                    value: "dice",
                    description: "Comment jouer aux Dés"
                }

            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await message.reply({

            embeds: [embed],

            components: [row]

        });

    }

};