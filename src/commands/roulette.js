const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");

const roulette =
    require("../services/casino/rouletteManager");

const {
    renderRoulette,
    DURATION
} =
    require("../services/casino/rouletteEngine");


const economyPath =
    path.join(
        __dirname,
        "..",
        "data",
        "economy.json"
    );


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


function loadEconomy() {

    return JSON.parse(
        fs.readFileSync(
            economyPath,
            "utf8"
        )
    );

}


function saveEconomy(
    economy
) {

    fs.writeFileSync(
        economyPath,
        JSON.stringify(
            economy,
            null,
            2
        ),
        "utf8"
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

        let economy;

        try {

            economy =
                loadEconomy();

        } catch (error) {

            console.error(
                "❌ Erreur economy.json :",
                error
            );

            return message.reply(
                "❌ Impossible de charger ton compte."
            );

        }


        if (
            !economy[userId]
        ) {

            economy[userId] = {

                money: 500,

                lastDaily: 0

            };

        }


        // =================================================
        // MISE
        // =================================================

        let amount =
            String(
                args[0]
            ).toLowerCase();


        if (
            amount === "all" ||
            amount === "max"
        ) {

            amount =
                Number(
                    economy[userId].money
                );

        } else {

            amount =
                Number(
                    amount
                );

        }


        if (
            !Number.isSafeInteger(
                amount
            ) ||
            amount <= 0
        ) {

            return message.reply(
                "❌ Mise invalide. Utilise un nombre entier supérieur à 0."
            );

        }


        if (
            economy[userId].money <
            amount
        ) {

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

        economy[userId].money -=
            amount;


        try {

            saveEconomy(
                economy
            );

        } catch (error) {

            console.error(
                "❌ Erreur sauvegarde mise :",
                error
            );

            economy[userId].money +=
                amount;

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

            economy[userId].money +=
                amount;

            try {
                saveEconomy(
                    economy
                );
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

            economy[userId].money +=
                amount;

            try {
                saveEconomy(
                    economy
                );
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

            if (
                game.win
            ) {

                economy[userId].money +=
                    game.gain;

            }


            saveEconomy(
                economy
            );


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
                            `💳 **Solde :** ${formatMoney(economy[userId].money)} NebuCoins`
                        ].join("\n")

                    )

                    .setFooter({
                        text:
                            "Nébulae • Roulette européenne"
                    })

                    .setTimestamp();


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

            economy[userId].money +=
                amount;


            try {

                saveEconomy(
                    economy
                );

            } catch (saveError) {

                console.error(
                    "❌ Erreur remboursement roulette :",
                    saveError
                );

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
                            `💰 **${formatMoney(amount)} NebuCoins ont été remboursés.**`
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