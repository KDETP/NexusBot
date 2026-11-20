const { EmbedBuilder } = require("discord.js");

const betManager = require("../services/casino/betManager");
const slots = require("../services/casino/slots");
const economyStore = require("../services/casino/economyStore");
const REEL_STOP_FRAMES = [5, 8, 11];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString("fr-FR");
}

function renderReels(reels) {
    return `## 🎰  ${reels[0].emoji}　${reels[1].emoji}　${reels[2].emoji}`;
}

function reelStatus(frame) {
    if (frame < REEL_STOP_FRAMES[0]) {
        return "🌀 Les trois rouleaux tournent...";
    }

    if (frame < REEL_STOP_FRAMES[1]) {
        return "✨ Premier rouleau arrêté — les deux autres tournent...";
    }

    if (frame < REEL_STOP_FRAMES[2]) {
        return "✨✨ Deuxième rouleau arrêté — dernier rouleau...";
    }

    return "🎰 Le résultat se révèle...";
}

function buildSpinEmbed(reels, bet, frame) {
    return new EmbedBuilder()
        .setColor("#8B5CF6")
        .setTitle("NÉBUL SLOTS")
        .setDescription([
            renderReels(reels),
            "",
            reelStatus(frame)
        ].join("\n"))
        .addFields({
            name: "💰 Mise",
            value: `**${formatMoney(bet)} NebuCoins**`,
            inline: true
        })
        .setFooter({ text: "Nébulae • Casino" });
}

function buildResultEmbed(reels, bet, game, balance) {
    const isMegaJackpot = game.type === "megaJackpot";
    const isJackpot = game.type === "jackpot" || isMegaJackpot;
    const isCombination = game.type === "combination";

    const title = isMegaJackpot
        ? "💥 MÉGA JACKPOT !"
        : isJackpot
            ? "🎉 JACKPOT !"
            : isCombination
                ? "✨ BELLE COMBINAISON !"
                : "🎰 PAS DE GAIN";

    const color = isMegaJackpot
        ? "#FF4D6D"
        : isJackpot
            ? "#F5C451"
            : isCombination
                ? "#57F287"
                : "#ED4245";

    const resultLine = game.gain > 0
        ? `${game.message} Multiplicateur : **x${game.multiplier}**`
        : "Pas cette fois — retente ta chance !";

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription([
            renderReels(reels),
            "",
            resultLine
        ].join("\n"))
        .addFields(
            {
                name: "💰 Mise",
                value: `**${formatMoney(bet)} NebuCoins**`,
                inline: true
            },
            {
                name: "🪙 Gain",
                value: game.gain > 0
                    ? `**+${formatMoney(game.gain)} NebuCoins**`
                    : "**Aucun gain**",
                inline: true
            },
            {
                name: "💳 Solde",
                value: `**${formatMoney(balance)} NebuCoins**`,
                inline: true
            }
        )
        .setFooter({ text: "Nébulae • Slots" })
}

function refundBet(userId, bet) {
    return economyStore.credit(userId, bet);
}

module.exports = {
    name: "slots",

    async execute(message, args) {
        const userId = message.author.id;

        if (slots.isActive(userId)) {
            return message.reply("🎰 Tu as déjà une partie de Slots en cours.");
        }

        let balance;

        try {
            balance = economyStore.getBalance(userId);
        } catch (error) {
            console.error("Erreur de lecture du solde Slots :", error);
            return message.reply("❌ Impossible de charger ton compte pour le moment.");
        }

        const result = betManager.getBet(args[0], balance);

        if (result.error) {
            return message.reply(result.error);
        }

        const bet = result.bet;

        if (!Number.isSafeInteger(bet) || bet > balance) {
            return message.reply("❌ Tu n'as pas assez de NebuCoins pour cette mise.");
        }

        if (!slots.start(userId)) {
            return message.reply("🎰 Tu as déjà une partie de Slots en cours.");
        }

        let wagerSaved = false;
        let payoutSaved = false;
        let refundSaved = false;
        let slotMessage;

        try {
            const debit = economyStore.debit(userId, bet);
            if (!debit.success) {
                slots.end(userId);
                return message.reply("❌ Tu n'as pas assez de NebuCoins pour cette mise.");
            }
            wagerSaved = true;

            const finalReels = slots.spin();
            const game = slots.evaluate(finalReels, bet);
            const currentReels = [{ emoji: "🌀" }, { emoji: "🌀" }, { emoji: "🌀" }];

            slotMessage = await message.reply({
                embeds: [buildSpinEmbed(currentReels, bet, 0)]
            });

            for (let frame = 0; frame <= REEL_STOP_FRAMES[2]; frame += 1) {
                currentReels.forEach((reel, index) => {
                    if (frame < REEL_STOP_FRAMES[index]) {
                        currentReels[index] = slots.randomSymbol();
                    } else {
                        currentReels[index] = finalReels[index];
                    }
                });

                await slotMessage.edit({
                    embeds: [buildSpinEmbed(currentReels, bet, frame)]
                });

                await sleep(180);
            }

            const balanceAfter = game.gain > 0
                ? economyStore.credit(userId, game.gain)
                : economyStore.getBalance(userId);
            payoutSaved = true;

            await slotMessage.edit({
                embeds: [buildResultEmbed(finalReels, bet, game, balanceAfter)]
            });
        } catch (error) {
            console.error("Erreur Slots :", error);

            if (wagerSaved && !payoutSaved) {
                try {
                    refundBet(userId, bet);
                    refundSaved = true;
                } catch (refundError) {
                    console.error("Erreur de remboursement Slots :", refundError);
                }
            }

            const errorEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle("❌ Slots indisponibles")
                .setDescription(wagerSaved && !payoutSaved
                    ? refundSaved
                        ? `Une erreur est survenue. **${formatMoney(bet)} NebuCoins** ont été remboursés.`
                        : "Une erreur est survenue et le remboursement n'a pas pu être enregistré. Contacte le staff."
                    : "Une erreur est survenue pendant la partie.");

            try {
                if (slotMessage) {
                    await slotMessage.edit({ embeds: [errorEmbed] });
                } else {
                    await message.reply({ embeds: [errorEmbed] });
                }
            } catch (messageError) {
                console.error("Impossible d'afficher l'erreur Slots :", messageError);
            }
        } finally {
            slots.end(userId);
        }
    }
};
