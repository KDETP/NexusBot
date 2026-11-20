const {
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const casinoSessions = require("../services/casino/casinoSessions");
const economy = require("../services/casino/economyStore");
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

const GAME_TITLES = {
    coinflip: "Pile ou Face",
    dice: "Dé haut ou bas"
};

async function checkOwner(interaction) {
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
            content: "❌ Ce casino appartient à un autre joueur.",
            ephemeral: true
        });
        return false;
    }

    return true;
}

function parseInteger(value) {
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

async function playQuickGame(interaction, game, bet, choice) {
    const betAmount = parseInteger(bet);
    const validChoice = game === "coinflip"
        ? ["pile", "face"].includes(choice)
        : game === "dice" && ["bas", "haut"].includes(choice);

    if (!betAmount || !validChoice) {
        return interaction.reply({
            content: "❌ Ce pari est invalide. Relance le menu du casino.",
            ephemeral: true
        });
    }

    let debit;
    try {
        debit = economy.debit(interaction.user.id, betAmount);
    } catch (error) {
        console.error("Erreur de mise au casino :", error);
        return interaction.reply({
            content: "❌ Impossible d'enregistrer ta mise pour le moment.",
            ephemeral: true
        });
    }

    if (!debit.success) {
        return interaction.reply({
            content: `❌ Solde insuffisant. Tu as **${debit.balance.toLocaleString("fr-FR")} NebuCoins**.`,
            ephemeral: true
        });
    }

    let resultLabel;
    let won;

    if (game === "coinflip") {
        resultLabel = Math.random() < 0.5 ? "pile" : "face";
        won = resultLabel === choice;
        resultLabel = resultLabel === "pile" ? "🪙 Pile" : "🪙 Face";
    } else {
        const roll = Math.floor(Math.random() * 6) + 1;
        resultLabel = `🎲 Le dé affiche **${roll}**`;
        won = choice === "bas" ? roll <= 3 : roll >= 4;
    }

    let balance;
    try {
        balance = won
            ? economy.credit(interaction.user.id, betAmount * 2)
            : economy.getBalance(interaction.user.id);
    } catch (error) {
        console.error("Erreur de paiement au casino :", error);
        try {
            economy.credit(interaction.user.id, betAmount);
        } catch (refundError) {
            console.error("Erreur de remboursement du casino :", refundError);
        }
        return interaction.reply({
            content: "❌ Une erreur est survenue. Ta mise a été remboursée si possible.",
            ephemeral: true
        });
    }

    casinoSessions.delete(interaction.message.id);

    const choiceLabel = game === "coinflip"
        ? (choice === "pile" ? "🪙 Pile" : "🪙 Face")
        : (choice === "bas" ? "1–3" : "4–6");

    const embed = new EmbedBuilder()
        .setColor(won ? "#57F287" : "#ED4245")
        .setTitle(won ? "🎉 Pari gagné !" : "🎲 Pari perdu")
        .setDescription([
            `**${GAME_TITLES[game]}**`,
            resultLabel,
            `Ton choix : **${choiceLabel}**`,
            "",
            `Mise : **${betAmount.toLocaleString("fr-FR")} NebuCoins**`,
            won
                ? `Retour total (mise incluse) : **${(betAmount * 2).toLocaleString("fr-FR")} NebuCoins**`
                : `Perte : **-${betAmount.toLocaleString("fr-FR")} NebuCoins**`,
            `Solde : **${balance.toLocaleString("fr-FR")} NebuCoins**`
        ].join("\n"))
        .setFooter({ text: "Nébul Casino • NebuCoins virtuels" });

    return interaction.update({ embeds: [embed], components: [] });
}

module.exports = async (client, interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "casino_menu") {
        if (!(await checkOwner(interaction))) return;

        const game = interaction.values[0];
        const titles = {
            mines: "💣 Mines",
            blackjack: "🃏 Blackjack",
            roulette: "🎡 Roulette",
            slots: "🎰 Machine à sous",
            coinflip: "🪙 Pile ou Face",
            dice: "🎲 Dé haut ou bas"
        };

        if (!titles[game]) {
            return interaction.reply({
                content: "❌ Ce jeu n'est pas disponible.",
                ephemeral: true
            });
        }

        const stakes = [10, 50, 100, 500, 1000];
        const row = new ActionRowBuilder().addComponents(
            stakes.map((amount, index) => {
                const styles = [
                    ButtonStyle.Secondary,
                    ButtonStyle.Secondary,
                    ButtonStyle.Primary,
                    ButtonStyle.Success,
                    ButtonStyle.Danger
                ];

                return new ButtonBuilder()
                    .setCustomId(`casino_${game}_${amount}`)
                    .setLabel(amount.toLocaleString("fr-FR"))
                    .setEmoji("🪙")
                    .setStyle(styles[index]);
            })
        );

        const embed = new EmbedBuilder()
            .setColor("#8B5CF6")
            .setTitle(titles[game])
            .setDescription([
                "Choisis ta mise pour commencer.",
                "",
                "Les NebuCoins sont virtuels et n'ont aucune valeur réelle."
            ].join("\n"))
            .setFooter({ text: "Nébul Casino" });

        return interaction.update({ embeds: [embed], components: [row] });
    }

    if (interaction.customId === "casino_roulette_bet") {
        if (!(await checkOwner(interaction))) return;

        const [rawBet, betType] = interaction.values[0].split("|");
        const amount = parseInteger(rawBet);
        const validBet = ROULETTE_BETS.some(option => option.value === betType);

        if (!amount || !validBet) {
            return interaction.reply({
                content: "❌ Ce pari de roulette est invalide.",
                ephemeral: true
            });
        }

        casinoSessions.delete(interaction.message.id);
        const command = require("../commands/roulette");
        return runCasinoCommand(interaction, command, [String(amount), betType]);
    }

    if (interaction.customId === "casino_quickplay") {
        if (!(await checkOwner(interaction))) return;

        const [game, bet, choice] = interaction.values[0].split("|");
        return playQuickGame(interaction, game, bet, choice);
    }
};
