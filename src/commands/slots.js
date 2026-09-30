const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const betManager = require("../services/casino/betManager");
const slots = require("../services/casino/slots");

const economyPath = path.join(__dirname, "..", "data", "economy.json");
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
        .setTimestamp();
}

function saveEconomy(economy) {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

function refundBet(userId, bet) {
    const economy = JSON.parse(fs.readFileSync(economyPath, "utf8"));

    if (!economy[userId]) {
        economy[userId] = { money: 0, lastDaily: 0 };
    }

    economy[userId].money += bet;
    saveEconomy(economy);
}

module.exports = {
    name: "slots",

    async execute(message, args) {
        const userId = message.author.id;

        if (slots.isActive(userId)) {
            return message.reply("🎰 Tu as déjà une partie de Slots en cours.");
        }

        let economy;

        try {
            economy = JSON.parse(fs.readFileSync(economyPath, "utf8"));
        } catch (error) {
            console.error("Erreur de lecture de economy.json :", error);
            return message.reply("❌ Impossible de charger ton compte pour le moment.");
        }

        if (!economy[userId]) {
            economy[userId] = { money: 500, lastDaily: 0 };
        }

        const result = betManager.getBet(args[0], economy[userId].money);

        if (result.error) {
            return message.reply(result.error);
        }

        const bet = result.bet;

        if (!Number.isInteger(bet) || bet > economy[userId].money) {
            return message.reply("❌ Tu n'as pas assez de NebuCoins pour cette mise.");
        }

        if (!slots.start(userId)) {
            return message.reply("🎰 Tu as déjà une partie de Slots en cours.");
        }

        let wagerSaved = false;
        let payoutSaved = false;
        let slotMessage;

        try {
            economy[userId].money -= bet;
            saveEconomy(economy);
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

            economy[userId].money += game.gain;
            saveEconomy(economy);
            payoutSaved = true;

            await slotMessage.edit({
                embeds: [buildResultEmbed(finalReels, bet, game, economy[userId].money)]
            });
        } catch (error) {
            console.error("Erreur Slots :", error);

            if (wagerSaved && !payoutSaved) {
                try {
                    refundBet(userId, bet);
                } catch (refundError) {
                    console.error("Erreur de remboursement Slots :", refundError);
                }
            }

            const errorEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle("❌ Slots indisponibles")
                .setDescription(wagerSaved && !payoutSaved
                    ? `Une erreur est survenue. **${formatMoney(bet)} NebuCoins** ont été remboursés.`
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
