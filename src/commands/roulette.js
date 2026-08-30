const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");

const roulette = require("../services/casino/rouletteManager");

const {
    renderRoulette
} = require("../services/casino/rouletteEngine");

const economyPath = path.join(
    __dirname,
    "..",
    "data",
    "economy.json"
);

const tempDir = path.join(
    __dirname,
    "..",
    "data",
    "roulette"
);

const VALID_BETS = [
    "rouge",
    "noir",
    "vert",
    "pair",
    "impair",
    "1-18",
    "19-36",
    "1-12",
    "13-24",
    "25-36"
];

function formatMoney(value) {
    return Number(value || 0).toLocaleString("fr-FR");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isNumberBet(bet) {
    const value = Number(bet);

    return (
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 36 &&
        String(value) === String(bet)
    );
}

function getColorDisplay(color) {
    if (color === "rouge") {
        return "🔴 Rouge";
    }

    if (color === "noir") {
        return "⚫ Noir";
    }

    return "🟢 Vert";
}

function ensureTempDir() {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(
            tempDir,
            {
                recursive: true
            }
        );
    }
}

module.exports = {

    name: "roulette",

    async execute(message, args) {

        // ==========================================
        // ARGUMENTS
        // ==========================================

        if (args.length < 2) {
            return message.reply(
                "❌ Utilisation : `nroulette <mise> <pari>`\n" +
                "Exemple : `nroulette 500 rouge`"
            );
        }

        const id =
            message.author.id;

        // ==========================================
        // EMPÊCHER DE LANCER 2 PARTIES
        // ==========================================

        if (roulette.get(id)) {
            return message.reply(
                "🎰 Tu as déjà une roulette en cours."
            );
        }

        // ==========================================
        // ECONOMIE
        // ==========================================

        let economy;

        try {
            economy = JSON.parse(
                fs.readFileSync(
                    economyPath,
                    "utf8"
                )
            );
        } catch (error) {
            console.error(
                "❌ Erreur lecture economy.json :",
                error
            );

            return message.reply(
                "❌ Impossible de charger ton compte."
            );
        }

        // ==========================================
        // COMPTE
        // ==========================================

        if (!economy[id]) {
            economy[id] = {
                money: 500,
                lastDaily: 0
            };
        }

        // ==========================================
        // MISE
        // ==========================================

        let amount =
            String(args[0])
                .toLowerCase();

        const bet =
            String(args[1])
                .toLowerCase();

        if (
            amount === "all" ||
            amount === "max"
        ) {
            amount =
                Number(
                    economy[id].money
                );
        } else {
            amount =
                Number(amount);
        }

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0
        ) {
            return message.reply(
                "❌ Mise invalide. Utilise un nombre entier supérieur à 0."
            );
        }

        if (
            economy[id].money < amount
        ) {
            return message.reply(
                "❌ Tu n'as pas assez de NebuCoins."
            );
        }

        // ==========================================
        // PARI
        // ==========================================

        const validBet =
            VALID_BETS.includes(bet) ||
            isNumberBet(bet);

        if (!validBet) {
            return message.reply(
                "❌ Pari invalide.\n\n" +
                "Paris disponibles : `rouge`, `noir`, `vert`, `pair`, `impair`, `1-18`, `19-36`, `1-12`, `13-24`, `25-36` ou un numéro de `0` à `36`."
            );
        }

        // ==========================================
        // RETRAIT DE LA MISE
        // ==========================================

        economy[id].money -=
            amount;

        try {
            fs.writeFileSync(
                economyPath,
                JSON.stringify(
                    economy,
                    null,
                    2
                )
            );
        } catch (error) {
            console.error(
                "❌ Erreur sauvegarde mise :",
                error
            );

            economy[id].money +=
                amount;

            return message.reply(
                "❌ Impossible d'enregistrer la mise."
            );
        }

        // ==========================================
        // CRÉATION DU RESULTAT
        // ==========================================

        let game;

        try {
            game =
                roulette.create(
                    id,
                    amount,
                    bet
                );
        } catch (error) {
            console.error(
                "❌ Erreur rouletteManager :",
                error
            );

            economy[id].money +=
                amount;

            try {
                fs.writeFileSync(
                    economyPath,
                    JSON.stringify(
                        economy,
                        null,
                        2
                    )
                );
            } catch {}

            roulette.end(id);

            return message.reply(
                "❌ Impossible de lancer la roulette. Ta mise a été remboursée."
            );
        }

        // ==========================================
        // MESSAGE DE CHARGEMENT
        // ==========================================

        const embed =
            new EmbedBuilder()
                .setColor("#8B5CF6")
                .setTitle("🎰 NÉBUL ROULETTE")
                .setDescription(
                    `💰 Mise : **${formatMoney(amount)} NebuCoins**\n` +
                    `🎯 Pari : **${bet}**\n\n` +
                    "🎡 **La roue tourne...**\n" +
                    "⚪ La bille est lancée..."
                )
                .setFooter({
                    text:
                        "Nébulae • Casino"
                });

        let msg;

        try {
            msg =
                await message.reply({
                    embeds: [
                        embed
                    ]
                });
        } catch (error) {
            console.error(
                "❌ Impossible d'envoyer le message roulette :",
                error
            );

            // Remboursement si Discord refuse le message.
            economy[id].money +=
                amount;

            try {
                fs.writeFileSync(
                    economyPath,
                    JSON.stringify(
                        economy,
                        null,
                        2
                    )
                );
            } catch {}

            roulette.end(id);

            return;
        }

        // Petite pause pour que le lancement soit perceptible.
        await sleep(350);

        // ==========================================
        // GENERATION VIDEO
        // ==========================================

        ensureTempDir();

        const fileName =
            `roulette_${id}_${Date.now()}.gif`;

        const outputPath =
            path.join(
                tempDir,
                fileName
            );

        try {

            await renderRoulette(
                game.number,
                outputPath
            );

            // ======================================
            // GAIN
            // ======================================

            if (game.win) {
                economy[id].money +=
                    game.gain;
            }

            try {
                fs.writeFileSync(
                    economyPath,
                    JSON.stringify(
                        economy,
                        null,
                        2
                    )
                );
            } catch (saveError) {
                console.error(
                    "❌ Erreur sauvegarde gain :",
                    saveError
                );

                // Le gain n'est pas perdu en mémoire
                // mais on évite de continuer à afficher
                // un résultat potentiellement incohérent.
                throw saveError;
            }

            // ======================================
            // RESULTAT
            // ======================================

            const colorDisplay =
                getColorDisplay(
                    game.color
                );

            embed
                .setColor(
                    game.win
                        ? "#57F287"
                        : "#ED4245"
                )
                .setTitle(
                    game.win
                        ? "🎉 NÉBUL ROULETTE • VICTOIRE"
                        : "💸 NÉBUL ROULETTE • DÉFAITE"
                )
                .setDescription(
                    `🎯 **Résultat**\n\n` +
                    `## ${game.number}\n` +
                    `${colorDisplay}\n\n` +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `🎯 Pari : **${bet}**\n` +
                    `💰 Mise : **${formatMoney(amount)} NebuCoins**\n` +
                    (
                        game.win
                            ? `🏆 Gain : **+${formatMoney(game.gain)} NebuCoins**`
                            : `❌ Perte : **-${formatMoney(amount)} NebuCoins**`
                    ) +
                    `\n💳 Solde : **${formatMoney(economy[id].money)} NebuCoins**`
                )
                .setFooter({
                    text:
                        "Nébulae • Casino • Roulette européenne"
                })
                .setTimestamp();

            const attachment =
                new AttachmentBuilder(
                    outputPath,
                    {
                        name:
                            "roulette.gif"
                    }
                );

            await msg.edit({
                embeds: [
                    embed
                ],
                files: [
                    attachment
                ]
            });

        } catch (error) {

            console.error(
                "❌ Erreur génération roulette :",
                error
            );

            // ======================================
            // REMBOURSEMENT SI L'ANIMATION ÉCHOUE
            // ======================================

            economy[id].money +=
                amount;

            try {
                fs.writeFileSync(
                    economyPath,
                    JSON.stringify(
                        economy,
                        null,
                        2
                    )
                );
            } catch (saveError) {
                console.error(
                    "❌ Erreur remboursement roulette :",
                    saveError
                );
            }

            embed
                .setColor("#ED4245")
                .setTitle(
                    "❌ Roulette indisponible"
                )
                .setDescription(
                    "Une erreur est survenue pendant la génération de l'animation.\n\n" +
                    `💰 **${formatMoney(amount)} NebuCoins ont été remboursés.**`
                );

            try {
                await msg.edit({
                    embeds: [
                        embed
                    ]
                });
            } catch {}

        } finally {

            // ======================================
            // NETTOYAGE
            // ======================================

            roulette.end(id);

            if (
                fs.existsSync(
                    outputPath
                )
            ) {
                try {
                    fs.unlinkSync(
                        outputPath
                    );
                } catch (error) {
                    console.error(
                        "⚠️ Impossible de supprimer la vidéo temporaire :",
                        error
                    );
                }
            }
        }
    }
};
