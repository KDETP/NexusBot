const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");

const roulette =
    require("../services/casino/rouletteManager");

const betManager =
    require("../services/casino/betManager");

const economyStore =
    require("../services/casino/economyStore");

const {
    renderRoulette,
    DURATION
} =
    require("../services/casino/rouletteEngine");


const tempDir =
    path.join(
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

    return Number(
        value || 0
    ).toLocaleString(
        "fr-FR"
    );

}


function isNumberBet(bet) {

    const value =
        Number(bet);

    return (
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 36 &&
        String(value) === String(bet)
    );

}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


module.exports = {

    name: "roulette",

    async execute(
        message,
        args
    ) {

        // =================================================
        // AIDE
        // =================================================

        if (
            args.length < 2
        ) {

            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#8B5CF6"
                        )

                        .setTitle(
                            "🎡 Roulette Nébula"
                        )

                        .setDescription(

                            [
                                "`nroulette <mise> <pari>`",
                                "",
                                "**Exemples :**",
                                "`nroulette 500 rouge`",
                                "`nroulette 1000 noir`",
                                "`nroulette 500 pair`",
                                "`nroulette 1000 17`",
                                "",
                                "**Paris disponibles :**",
                                "🔴 `rouge`",
                                "⚫ `noir`",
                                "🟢 `vert`",
                                "⚪ `pair`",
                                "⚫ `impair`",
                                "`1-18` • `19-36`",
                                "`1-12` • `13-24` • `25-36`",
                                "`0` à `36`"
                            ].join("\n")
                        )

                ]

            });

        }


        const userId =
            message.author.id;


        // =================================================
        // PARTIE EXISTANTE
        // =================================================

        if (
            roulette.get(
                userId
            )
        ) {

            return message.reply(
                "🎡 Tu as déjà une roulette en cours."
            );

        }


        // =================================================
        // ECONOMIE
        // =================================================

        let balance;

        try {
            balance = economyStore.getBalance(userId);

        } catch (error) {

            console.error(
                "❌ Erreur de lecture du solde roulette :",
                error
            );

            return message.reply(
                "❌ Impossible de charger ton compte."
            );

        }


        // =================================================
        // MISE
        // =================================================

        const amountInput = String(args[0] || "").toLowerCase();
        const betResult = betManager.getBet(
            amountInput === "max" ? "all" : amountInput,
            balance
        );

        if (betResult.error) {
            return message.reply(betResult.error);
        }

        const amount = betResult.bet;


        if (balance < amount) {

            return message.reply(
                "❌ Tu n'as pas assez de NebuCoins."
            );

        }


        // =================================================
        // PARI
        // =================================================

        const bet =
            String(
                args[1]
            ).toLowerCase();


        const validBet =
            VALID_BETS.includes(
                bet
            ) ||
            isNumberBet(
                bet
            );


        if (
            !validBet
        ) {

            return message.reply(
                "❌ Pari invalide."
            );

        }


        // =================================================
        // RETRAIT DE LA MISE
        // =================================================

        let wagerSaved = false;
        let settlementSaved = false;
        try {
            const debit = economyStore.debit(userId, amount);
            if (!debit.success) {
                return message.reply(
                    "❌ Tu n'as pas assez de NebuCoins."
                );
            }
            wagerSaved = true;

        } catch (error) {

            console.error(
                "❌ Erreur sauvegarde mise :",
                error
            );

            return message.reply(
                "❌ Impossible d'enregistrer la mise."
            );

        }


        // =================================================
        // CREER LE JEU
        // =================================================

        let game;

        try {

            game =
                roulette.create(
                    userId,
                    amount,
                    bet
                );

        } catch (error) {

            console.error(
                "❌ Erreur rouletteManager :",
                error
            );

            try {
                economyStore.credit(userId, amount);
                wagerSaved = false;
            } catch {}

            return message.reply(
                "❌ Impossible de lancer la roulette. Ta mise a été remboursée."
            );

        }


        // =================================================
        // MESSAGE INITIAL
        // =================================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎡 NÉBUL ROULETTE"
                )

                .setDescription(

                    [
                        `💰 **Mise :** ${formatMoney(amount)} NebuCoins`,
                        `🎯 **Pari :** ${roulette.getBetLabel(bet)}`,
                        "",
                        "🎡 **La roue tourne...**",
                        "⚪ La bille cherche sa case..."
                    ].join("\n")

                )

                .setFooter({
                    text:
                        "Nébulae • Roulette européenne"
                });


        let sentMessage;

        try {

            sentMessage =
                await message.reply({
                    embeds: [
                        embed
                    ]
                });

        } catch (error) {

            console.error(
                "❌ Erreur message roulette :",
                error
            );

            try {
                economyStore.credit(userId, amount);
                wagerSaved = false;
            } catch {}

            roulette.end(
                userId
            );

            return;
        }


        // =================================================
        // GIF
        // =================================================

        const outputPath =
            path.join(
                tempDir,
                `roulette_${userId}_${Date.now()}.gif`
            );


        try {

            fs.mkdirSync(tempDir, { recursive: true });

            await renderRoulette(
                game.number,
                outputPath
            );


            // =============================================
            // AFFICHER L'ANIMATION
            // =============================================

            const animationAttachment =
                new AttachmentBuilder(
                    outputPath,
                    {
                        name:
                            "roulette.gif"
                    }
                );


            await sentMessage.edit({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#8B5CF6"
                        )

                        .setTitle(
                            "🎡 NÉBUL ROULETTE"
                        )

                        .setDescription(

                            [
                                `💰 **Mise :** ${formatMoney(amount)} NebuCoins`,
                                `🎯 **Pari :** ${roulette.getBetLabel(bet)}`,
                                "",
                                "🎡 **La roue tourne...**",
                                "⚪ La bille cherche sa case..."
                            ].join("\n")

                        )

                        .setFooter({
                            text:
                                "Nébulae • Roulette européenne"
                        })

                ],

                files: [
                    animationAttachment
                ]

            });


            // =============================================
            // ATTENDRE LA FIN DU GIF
            // =============================================

            await sleep(
                Math.ceil(
                    DURATION * 1000
                ) + 250
            );


            // =============================================
            // PAYER SI GAGNÉ
            // =============================================

            const finalBalance = game.win
                ? economyStore.credit(userId, game.gain)
                : economyStore.getBalance(userId);
            settlementSaved = true;


            // =============================================
            // COULEUR DU NUMÉRO
            // =============================================

            const colorLabel =
                game.color === "rouge"
                    ? "🔴 Rouge"
                    : game.color === "noir"
                        ? "⚫ Noir"
                        : "🟢 Vert";


            // =============================================
            // RESULTAT FINAL
            // =============================================

            const finalEmbed =
                new EmbedBuilder()

                    .setColor(
                        game.win
                            ? "#57F287"
                            : "#ED4245"
                    )

                    .setTitle(
                        game.win
                            ? "🎉 ROULETTE • GAGNÉ"
                            : "💸 ROULETTE • PERDU"
                    )

                    .setDescription(

                        [
                            `## ${game.number}`,
                            `${colorLabel}`,
                            "",
                            `🎯 **Pari :** ${roulette.getBetLabel(game.bet)}`,
                            `💰 **Mise :** ${formatMoney(game.amount)} NebuCoins`,
                            "",
                            game.win
                                ? `🏆 **Gain :** +${formatMoney(game.gain)} NebuCoins`
                                : `❌ **Perte :** -${formatMoney(game.amount)} NebuCoins`,
                            "",
                            `💳 **Solde :** ${formatMoney(finalBalance)} NebuCoins`
                        ].join("\n")

                    )

                    .setFooter({
                        text:
                            "Nébulae • Roulette européenne"
                    })


            // =============================================
            // REMPLACER LE MESSAGE
            // =============================================

            await sentMessage.edit({

                embeds: [
                    finalEmbed
                ],

                // On supprime le GIF du message final.
                files: []

            });


        } catch (error) {

            console.error(
                "❌ Erreur roulette :",
                error
            );


            // =============================================
            // REMBOURSEMENT
            // =============================================

            let refundSaved = false;
            if (wagerSaved && !settlementSaved) {
                try {
                    economyStore.credit(userId, amount);
                    wagerSaved = false;
                    refundSaved = true;

                } catch (saveError) {

                    console.error(
                        "❌ Erreur remboursement roulette :",
                        saveError
                    );

                }
            }


            const errorEmbed =
                new EmbedBuilder()

                    .setColor(
                        "#ED4245"
                    )

                    .setTitle(
                        "❌ Roulette indisponible"
                    )

                    .setDescription(

                        [
                            "Une erreur est survenue.",
                            "",
                            settlementSaved
                                ? "La partie a déjà été réglée et ton solde est à jour."
                                : refundSaved
                                    ? `💰 **${formatMoney(amount)} NebuCoins ont été remboursés.**`
                                    : "Le remboursement n'a pas pu être enregistré. Contacte le staff."
                        ].join("\n")

                    );


            try {

                await sentMessage.edit({

                    embeds: [
                        errorEmbed
                    ],

                    files: []

                });

            } catch {}

        } finally {

            roulette.end(
                userId
            );


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
                        "⚠️ Impossible de supprimer le GIF roulette :",
                        error
                    );

                }

            }

        }

    }

};
