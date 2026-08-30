const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const economyPath = path.join(__dirname, "..", "data", "economy.json");

const mines = require("../services/casino/minesManager");
const casinoSessions = require("../services/casino/casinoSessions");

function createBoard(game, revealAll = false) {

    const rows = [];

    let index = 0;

    for (let i = 0; i < 4; i++) {

        const row = new ActionRowBuilder();

        for (let i = 0; i < 4; i++) {

            const opened =
                revealAll ||
                game.revealed.includes(index);

            let emoji = "🟩";

            if (opened) {

                emoji =
                    game.board[index] === "💣"
                        ? "💣"
                        : "💎";

            }

            row.addComponents(

                new ButtonBuilder()

                    .setCustomId(`mine_${game.userId}_${index}`)

                    .setEmoji(emoji)

                    .setStyle(ButtonStyle.Secondary)

                    .setDisabled(opened || revealAll)

            );

            index++;

        }

        rows.push(row);

    }

    rows.push(

        new ActionRowBuilder().addComponents(

            new ButtonBuilder()

                .setCustomId(`cashout_${game.userId}`)

                .setLabel(
                    `💸 Encaisser ${Math.floor(game.bet * game.multiplier)}`
                )

                .setStyle(ButtonStyle.Success)

                .setDisabled(revealAll)

        )

    );

    return rows;

}

module.exports = async (client, interaction) => {

    if (!interaction.isButton()) return;

    if (
    interaction.customId === "close_ticket" ||
    interaction.customId === "accept_ticket" ||
    interaction.customId === "deny_ticket" ||
    interaction.customId === "create_ticket"
) return;

    const currentGame = mines.get(interaction.user.id);

    if (
       interaction.customId.startsWith("mine_") ||
interaction.customId.startsWith("cashout_")
    ) {

        if (!currentGame) {

            return interaction.reply({

                content:
                    "❌ Cette partie n'existe plus.",

                ephemeral: true

            });

        }

    }

    // ===============================
    // DEMARRER UNE PARTIE
    // ===============================

    if (interaction.customId.startsWith("mines_")) {
            
        const ownerId = casinoSessions.get(interaction.message.id);

    if (!ownerId) {
        return interaction.reply({
            content: "❌ Cette session de casino n'existe plus.",
            ephemeral: true
        });
    }

    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: "❌ Tu ne peux pas utiliser le casino d'un autre joueur.",
            ephemeral: true
        });
    }

        const bet = Number(
            interaction.customId.split("_")[1]
        );

        const economy = JSON.parse(
            fs.readFileSync(economyPath, "utf8")
        );

        if (!economy[interaction.user.id]) {

            economy[interaction.user.id] = {

                money: 500

            };

        }

        if (economy[interaction.user.id].money < bet) {

    if (interaction.replied || interaction.deferred) {

        return interaction.reply({
            content: "❌ Tu n'as pas assez de NebuCoins.",
            ephemeral: true
        });

    }

    return interaction.reply({
        content: "❌ Tu n'as pas assez de NebuCoins.",
        ephemeral: true
    });

}
                if (!mines.create(interaction.user.id, bet)) {

            return interaction.reply({

                content:
                    "❌ Tu as déjà une partie en cours.",

                ephemeral: true

            });

        }

        economy[interaction.user.id].money -= bet;

        fs.writeFileSync(

            economyPath,

            JSON.stringify(
                economy,
                null,
                2
            )

        );

        const game =
            mines.get(interaction.user.id);

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle("💣 Mines")

                    .setDescription(

`💰 Mise : **${bet}**

💎 Multiplicateur : **x1.00**

Choisis une case.`

                    )

            ],

            components: createBoard(game)

        });

    }

    // ===============================
    // CLIQUER SUR UNE CASE
    // ===============================

    if (interaction.customId.startsWith("mine_")) {

            const ownerId = interaction.customId.split("_")[1];

    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: "❌ Cette partie ne t'appartient pas.",
            ephemeral: true
        });
    }

        const index = Number(
    interaction.customId.split("_")[2]
        );

        const result = mines.reveal(
            interaction.user.id,
            index
        );

        if (!result) {

            return interaction.reply({

                content: "❌ Partie introuvable.",

                ephemeral: true

            });

        }

        if (result === "already") {

            return interaction.deferUpdate();

        }

        // ==========================
        // BOOM
        // ==========================

        if (result === "bomb") {

            const game = mines.get(interaction.user.id);

            // Révèle toutes les cases avant de supprimer la partie
            const board = createBoard(game, true);

            mines.end(interaction.user.id);

            return interaction.update({

                embeds: [

                    new EmbedBuilder()

                        .setColor("#ff2d55")

                        .setTitle("💥 BOOM !")

                        .setDescription(

`💣 Tu as touché une bombe !

❌ Tu perds **${game.bet} NebuCoins**

💎 Diamants trouvés : **${game.revealed.length - 1}**`

                        )

                        .setFooter({
                            text: "Retente ta chance ! 🍀"
                        })

                ],

                components: board

            });

        }

        // ==========================
        // DIAMANT
        // ==========================

        const game =
            mines.get(interaction.user.id);

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle("💣 Mines")

                    .setDescription(

`💰 Mise : **${game.bet}**

💎 Multiplicateur : **x${game.multiplier.toFixed(2)}**

💸 Gain actuel : **${Math.floor(
    game.bet * game.multiplier
)} NebuCoins**

Continue... ou encaisse.`

                    )

            ],

            components: createBoard(game)

        });

    }

    // ===============================
    // ENCAISSER
    // ===============================

    if (interaction.customId.startsWith("cashout_")) {

            const ownerId = interaction.customId.split("_")[1];

    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: "❌ Cette partie ne t'appartient pas.",
            ephemeral: true
        });
    }

        const gain =
            mines.cashout(interaction.user.id);

        if (!gain) {

            return interaction.reply({

                content:
                    "❌ Tu n'as pas de partie.",

                ephemeral: true

            });

        }

        const economy = JSON.parse(

            fs.readFileSync(
                economyPath,
                "utf8"
            )

        );

        if (!economy[interaction.user.id]) {

            economy[interaction.user.id] = {

                money: 500

            };

        }

        economy[interaction.user.id].money += gain;

        fs.writeFileSync(

            economyPath,

            JSON.stringify(
                economy,
                null,
                2
            )

        );

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor("Green")

                    .setTitle("💸 Gains encaissés")

                    .setDescription(

`Tu remportes **${gain} NebuCoins** ! 🎉

Merci d'avoir joué à Mines 🍀`

                    )

            ],

            components: []

        });

    }

};