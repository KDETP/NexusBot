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
`Bienvenue au **Casino Nébul** !

🪙 Joue avec des **NebuCoins virtuels** — aucune mise d'argent réel.
🎲 Choisis ta mise et ton jeu dans le menu ci-dessous.
🏆 Bonne chance !`
            )

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
                },

                {
                    label: "🪙 Pile ou Face",
                    description: "Choisis un côté et tente ta chance.",
                    value: "coinflip"
                },

                {
                    label: "🎲 Dé haut ou bas",
                    description: "Parie sur 1–3 ou 4–6.",
                    value: "dice"
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
