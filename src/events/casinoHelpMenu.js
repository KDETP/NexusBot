const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

module.exports = async (client, interaction) => {

    // ================= MENU =================

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== "casino_help") return;

        const game = interaction.values[0];

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setFooter({
                text: "Nébul Casino • Guide"
            });

        switch (game) {

            case "mines":

                embed

                    .setTitle("💣 Guide • Mines")

                    .setDescription(`🎯 **Objectif**

Trouve les 💎 sans toucher une 💣.

Chaque diamant augmente ton multiplicateur.

Tu peux encaisser quand tu veux.

Si tu trouves une bombe...

💥 Tu perds tout.`);

                break;

            case "blackjack":

                embed

                    .setTitle("🃏 Guide • Blackjack")

                    .setDescription(`Atteins **21** sans dépasser.

Plus proche de 21 que le croupier = victoire.`);

                break;

            case "roulette":

                embed

                    .setTitle("🎡 Guide • Roulette")

                    .setDescription(`Parie sur :

🔴 Rouge

⚫ Noir

🟢 Vert

Ou un numéro précis.`);

                break;

            case "slots":

                embed

                    .setTitle("🎰 Guide • Machine à sous")

                    .setDescription(`Obtiens 3 symboles identiques.

Plus le symbole est rare...

Plus tu gagnes.`);

                break;

            case "coinflip":

                embed

                    .setTitle("🪙 Guide • Pile ou Face")

                    .setDescription(`Choisis **Pile** ou **Face**.

Tu gagnes si le résultat correspond à ton choix. Le retour total vaut **2× ta mise**, mise initiale incluse.`);

                break;

            case "dice":

                embed

                    .setTitle("🎲 Guide • Dés")

                    .setDescription(`Choisis **Bas (1 à 3)** ou **Haut (4 à 6)**.

Tu gagnes si le dé tombe dans ta moitié. Le retour total vaut **2× ta mise**, mise initiale incluse.`);

                break;

        }

        const row = new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId("casino_help_back")

                    .setLabel("Retour")

                    .setEmoji("⬅️")

                    .setStyle(ButtonStyle.Secondary)

            );

        return interaction.update({

            embeds: [embed],

            components: [row]

        });

    }

    // ================= RETOUR =================

    if (interaction.isButton()) {

        if (interaction.customId !== "casino_help_back") return;

        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎰 Guide du Casino Nébul")

            .setDescription(`Bienvenue !

Choisis un jeu pour voir toutes les règles.`);

        const menu = new StringSelectMenuBuilder()

            .setCustomId("casino_help")

            .setPlaceholder("📚 Choisis un jeu...")

            .addOptions(

                {
                    label: "💣 Mines",
                    value: "mines",
                    description: "Guide complet"
                },

                {
                    label: "🃏 Blackjack",
                    value: "blackjack",
                    description: "Guide complet"
                },

                {
                    label: "🎰 Machine à sous",
                    value: "slots",
                    description: "Guide complet"
                },

                {
                    label: "🎡 Roulette",
                    value: "roulette",
                    description: "Guide complet"
                },

                {
                    label: "🪙 Pile ou Face",
                    value: "coinflip",
                    description: "Guide complet"
                },

                {
                    label: "🎲 Dé haut ou bas",
                    value: "dice",
                    description: "Guide complet"
                }

            );

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.update({

            embeds: [embed],

            components: [row]

        });

    }

};
