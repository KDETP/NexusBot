const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");

const economy = require("../services/casino/economyStore");
const betManager = require("../services/casino/betManager");
const mines = require("../services/casino/minesManager");
const casinoSessions = require("../services/casino/casinoSessions");
const runCasinoCommand = require("../services/casino/interactionRunner");

const ROULETTE_BETS = [
    { label: "Rouge", value: "rouge", emoji: "🔴" },
    { label: "Noir", value: "noir", emoji: "⚫" },
    { label: "Vert (0)", value: "vert", emoji: "🟢" },
    { label: "Pair", value: "pair", emoji: "⚪" },
    { label: "Impair", value: "impair", emoji: "⚫" },
    { label: "1–18", value: "1-18" },
    { label: "19–36", value: "19-36" },
    { label: "1re douzaine", value: "1-12" },
    { label: "2e douzaine", value: "13-24" },
    { label: "3e douzaine", value: "25-36" }
];

function createBoard(game, revealAll = false) {
    const rows = [];
    let index = 0;

    for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
        const row = new ActionRowBuilder();

        for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
            const opened = revealAll || game.revealed.includes(index);
            const emoji = opened
                ? (game.board[index] === "💣" ? "💣" : "💎")
                : "🟩";

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`mine_${game.userId}_${index}`)
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(opened || revealAll)
            );

            index += 1;
        }

        rows.push(row);
    }

    rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`cashout_${game.userId}`)
            .setLabel(`💸 Encaisser ${Math.floor(game.bet * game.multiplier).toLocaleString("fr-FR")}`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(revealAll)
    ));

    return rows;
}

async function checkMenuOwner(interaction) {
    const ownerId = casinoSessions.get(interaction.message.id);

    if (!ownerId) {
        await interaction.reply({
            content: "❌ Ce menu de casino a expiré. Relance `nebu casino`.",
            ephemeral: true
        });
        return false;
    }

    if (ownerId !== interaction.user.id) {
        await interaction.reply({
            content: "❌ Tu ne peux pas utiliser le casino d'un autre joueur.",
            ephemeral: true
        });
        return false;
    }

    return true;
}

function readBet(customId) {
    const bet = Number(customId.slice(customId.lastIndexOf("_") + 1));
    return Number.isSafeInteger(bet) && bet > 0 ? bet : null;
}

async function showRouletteBets(interaction, amount) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("casino_roulette_bet")
        .setPlaceholder("Choisis ton pari")
        .addOptions(ROULETTE_BETS.map(option => ({
            label: option.label,
            value: `${amount}|${option.value}`,
            ...(option.emoji ? { emoji: option.emoji } : {})
        })));

    const embed = new EmbedBuilder()
        .setColor("#8B5CF6")
        .setTitle("🎡 Roulette européenne")
        .setDescription([
            `Mise : **${amount.toLocaleString("fr-FR")} NebuCoins**`,
            "Le numéro exact de 0 à 36 reste disponible avec la commande `nroulette <mise> <numéro>`."
        ].join("\n\n"))
        .setFooter({ text: "Nébul Casino" });

    return interaction.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
    });
}

async function showQuickGameChoices(interaction, game, amount) {
    const choices = game === "coinflip"
        ? [
            { label: "Pile", value: `${game}|${amount}|pile`, emoji: "🪙" },
            { label: "Face", value: `${game}|${amount}|face`, emoji: "🪙" }
        ]
        : [
            { label: "Bas : 1 à 3", value: `${game}|${amount}|bas`, emoji: "⬇️" },
            { label: "Haut : 4 à 6", value: `${game}|${amount}|haut`, emoji: "⬆️" }
        ];

    const menu = new StringSelectMenuBuilder()
        .setCustomId("casino_quickplay")
        .setPlaceholder("Choisis ton pari")
        .addOptions(choices);

    const embed = new EmbedBuilder()
        .setColor("#8B5CF6")
        .setTitle(game === "coinflip" ? "🪙 Pile ou Face" : "🎲 Dé haut ou bas")
        .setDescription(`Mise : **${amount.toLocaleString("fr-FR")} NebuCoins**\nUn bon pari retourne **2× la mise au total**, mise initiale incluse.`)
        .setFooter({ text: "Nébul Casino" });

    return interaction.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
    });
}

async function startMines(interaction, bet) {
    let balance;
    try {
        balance = economy.getBalance(interaction.user.id);
    } catch (error) {
        console.error("Erreur de lecture du solde Mines :", error);
        return interaction.reply({
            content: "❌ Impossible de charger ton compte pour le moment.",
            ephemeral: true
        });
    }

    const checkedBet = betManager.getBet(String(bet), balance);
    if (checkedBet.error) {
        return interaction.reply({ content: checkedBet.error, ephemeral: true });
    }

    if (!mines.create(interaction.user.id, checkedBet.bet)) {
        return interaction.reply({
            content: "❌ Tu as déjà une partie de Mines en cours.",
            ephemeral: true
        });
    }

    let debit;
    try {
        debit = economy.debit(interaction.user.id, checkedBet.bet);
    } catch (error) {
        mines.end(interaction.user.id);
        console.error("Erreur de mise à Mines :", error);
        return interaction.reply({
            content: "❌ Impossible d'enregistrer ta mise.",
            ephemeral: true
        });
    }

    if (!debit.success) {
        mines.end(interaction.user.id);
        return interaction.reply({
            content: `❌ Solde insuffisant. Tu as **${debit.balance.toLocaleString("fr-FR")} NebuCoins**.`,
            ephemeral: true
        });
    }

    const game = mines.get(interaction.user.id);
    try {
        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("💣 Mines")
                .setDescription([
                    `💰 Mise : **${checkedBet.bet.toLocaleString("fr-FR")} NebuCoins**`,
                    "💎 Multiplicateur : **x1,00**",
                    "Choisis une case."
                ].join("\n\n"))],
            components: createBoard(game)
        });
        casinoSessions.delete(interaction.message.id);
    } catch (error) {
        mines.end(interaction.user.id);
        try {
            economy.credit(interaction.user.id, checkedBet.bet);
        } catch (refundError) {
            console.error("Erreur de remboursement Mines :", refundError);
        }
        throw error;
    }
}

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    if (id.startsWith("casino_mines_")) {
        if (!(await checkMenuOwner(interaction))) return;
        const bet = readBet(id);
        if (!bet) {
            return interaction.reply({ content: "❌ Mise invalide.", ephemeral: true });
        }
        return startMines(interaction, bet);
    }

    if (id.startsWith("casino_slots_")) {
        if (!(await checkMenuOwner(interaction))) return;
        const bet = readBet(id);
        if (!bet) {
            return interaction.reply({ content: "❌ Mise invalide.", ephemeral: true });
        }
        casinoSessions.delete(interaction.message.id);
        return runCasinoCommand(interaction, require("../commands/slots"), [String(bet)]);
    }

    if (id.startsWith("casino_roulette_")) {
        if (!(await checkMenuOwner(interaction))) return;
        const bet = readBet(id);
        if (!bet) {
            return interaction.reply({ content: "❌ Mise invalide.", ephemeral: true });
        }
        return showRouletteBets(interaction, bet);
    }

    if (id.startsWith("casino_coinflip_") || id.startsWith("casino_dice_")) {
        if (!(await checkMenuOwner(interaction))) return;
        const bet = readBet(id);
        if (!bet) {
            return interaction.reply({ content: "❌ Mise invalide.", ephemeral: true });
        }
        const game = id.startsWith("casino_coinflip_") ? "coinflip" : "dice";
        return showQuickGameChoices(interaction, game, bet);
    }

    if (id.startsWith("mine_")) {
        const ownerId = id.split("_")[1];
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "❌ Cette partie ne t'appartient pas.",
                ephemeral: true
            });
        }

        const result = mines.reveal(ownerId, Number(id.split("_")[2]));
        if (!result) {
            return interaction.reply({ content: "❌ Partie introuvable.", ephemeral: true });
        }
        if (result === "already") return interaction.deferUpdate();

        const game = mines.get(ownerId);
        if (result === "bomb") {
            const board = createBoard(game, true);
            mines.end(ownerId);

            return interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor("#ff2d55")
                    .setTitle("💥 BOOM !")
                    .setDescription([
                        "💣 Tu as touché une bombe !",
                        `❌ Tu perds **${game.bet.toLocaleString("fr-FR")} NebuCoins**`,
                        `💎 Diamants trouvés : **${game.revealed.length - 1}**`
                    ].join("\n\n"))
                    .setFooter({ text: "Retente ta chance ! 🍀" })],
                components: board
            });
        }

        return interaction.update({
            embeds: [new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("💣 Mines")
                .setDescription([
                    `💰 Mise : **${game.bet.toLocaleString("fr-FR")} NebuCoins**`,
                    `💎 Multiplicateur : **x${game.multiplier.toFixed(2)}**`,
                    `💸 Gain encaissable : **${Math.floor(game.bet * game.multiplier).toLocaleString("fr-FR")} NebuCoins**`,
                    "Continue... ou encaisse."
                ].join("\n\n"))],
            components: createBoard(game)
        });
    }

    if (id.startsWith("cashout_")) {
        const ownerId = id.split("_")[1];
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: "❌ Cette partie ne t'appartient pas.",
                ephemeral: true
            });
        }

        const game = mines.get(ownerId);
        if (!game) {
            return interaction.reply({ content: "❌ Tu n'as pas de partie.", ephemeral: true });
        }

        const gain = Math.floor(game.bet * game.multiplier);
        let balance;
        try {
            balance = economy.credit(ownerId, gain);
        } catch (error) {
            console.error("Erreur de paiement Mines :", error);
            return interaction.reply({
                content: "❌ Impossible d'enregistrer le gain. Ta partie est toujours en cours.",
                ephemeral: true
            });
        }

        mines.end(ownerId);
        return interaction.update({
            embeds: [new EmbedBuilder()
                .setColor("Green")
                .setTitle("💸 Gains encaissés")
                .setDescription([
                    `Tu remportes **${gain.toLocaleString("fr-FR")} NebuCoins** ! 🎉`,
                    `💳 Solde : **${balance.toLocaleString("fr-FR")} NebuCoins**`
                ].join("\n\n"))],
            components: []
        });
    }
};
