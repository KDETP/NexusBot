const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const casinoSessions = require("../services/casino/casinoSessions");

module.exports = async (client, interaction) => {

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "casino_menu") return;

    const ownerId = casinoSessions.get(interaction.message.id);

    if (!ownerId) {
        return interaction.reply({
            content: "❌ Cette session de casino n'existe plus.",
            ephemeral: true
        });
    }

    if (ownerId !== interaction.user.id) {
        return interaction.reply({
            content: "❌ Ce casino appartient à un autre joueur.",
            ephemeral: true
        });
    }

    // ===========================
    // MINES
    // ===========================

    if (interaction.values[0] === "mines") {

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("💣 Mines")

            .setDescription(
`Bienvenue dans **Mines** !

Choisis une mise.`
            );

        const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("mines_500")
                .setLabel("500")
                .setEmoji("💰")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("mines_1000")
                .setLabel("1000")
                .setEmoji("💰")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("mines_5000")
                .setLabel("5000")
                .setEmoji("💎")
                .setStyle(ButtonStyle.Danger)

        );

        return interaction.update({

            embeds: [embed],

            components: [row]

        });

    }

    // ===========================
    // BLACKJACK
    // ===========================

    if (interaction.values[0] === "blackjack") {

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🃏 Blackjack")

            .setDescription(
`Bienvenue dans **Blackjack** !

Choisis une mise.

🎯 Objectif : atteindre **21** sans dépasser.

Le croupier jouera après toi.`
            );

        const row = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("blackjack_500")
                .setLabel("500")
                .setEmoji("💰")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("blackjack_1000")
                .setLabel("1000")
                .setEmoji("💰")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("blackjack_5000")
                .setLabel("5000")
                .setEmoji("💎")
                .setStyle(ButtonStyle.Danger)

        );

        return interaction.update({

            embeds: [embed],

            components: [row]

        });

    }

        // ===========================
    // ROULETTE
    // ===========================

    if (interaction.values[0] === "roulette") {

        return interaction.reply({

            content: "🎡 Roulette bientôt disponible.",

            ephemeral: true

        });

    }

    // ===========================
    // SLOTS
    // ===========================

    if (interaction.values[0] === "slots") {

        return interaction.reply({

            content: "🎰 Machine à sous bientôt disponible.",

            ephemeral: true

        });

    }

};