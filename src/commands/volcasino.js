const fs = require("fs");
const path = require("path");

const economyPath = path.join(
    __dirname,
    "..",
    "data",
    "economy.json"
);

const profilesPath = path.join(
    __dirname,
    "..",
    "data",
    "profiles.json"
);

const robberyPath = path.join(
    __dirname,
    "..",
    "data",
    "robbery.json"
);


// =====================================================
// CONFIG
// =====================================================

const MIN_TARGET_MONEY = 500;

const THIEF_COOLDOWN = 60 * 60 * 1000; // 1h
const TARGET_COOLDOWN = 6 * 60 * 60 * 1000; // 6h


// =====================================================
// UTILITAIRES
// =====================================================

function loadJson(file, fallback = {}) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(
            file,
            JSON.stringify(
                fallback,
                null,
                2
            ),
            "utf8"
        );

        return fallback;
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            `❌ Erreur lecture ${file}:`,
            error
        );

        return fallback;
    }
}


function saveJson(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}


function formatMoney(amount) {

    return Number(
        amount || 0
    ).toLocaleString(
        "fr-FR"
    );
}


function getTargetId(message, args) {

    const mentioned =
        message.mentions.users.first();

    if (mentioned) {
        return mentioned.id;
    }

    const raw =
        args[0];

    if (!raw) {
        return null;
    }

    const id =
        raw.replace(
            /[<@!>]/g,
            ""
        );

    if (
        /^\d{17,20}$/.test(id)
    ) {
        return id;
    }

    return null;
}


// =====================================================
// VOL POTENTIEL
// =====================================================

function getStealConfig(balance) {

    if (balance < 2500) {

        return {
            minPercent: 0.05,
            maxPercent: 0.10,
            cap: 150
        };

    }

    if (balance < 10000) {

        return {
            minPercent: 0.04,
            maxPercent: 0.08,
            cap: 400
        };

    }

    if (balance < 50000) {

        return {
            minPercent: 0.03,
            maxPercent: 0.06,
            cap: 1000
        };

    }

    if (balance < 250000) {

        return {
            minPercent: 0.025,
            maxPercent: 0.05,
            cap: 3500
        };

    }

    return {
        minPercent: 0.02,
        maxPercent: 0.04,
        cap: 10000
    };
}


// =====================================================
// COMMANDE
// =====================================================

module.exports = {

    name: "vol",

    async execute(message, args) {

        const thiefId =
            message.author.id;


        // =================================================
        // CIBLE
        // =================================================

        const targetId =
            getTargetId(
                message,
                args
            );


        if (!targetId) {

            return message.reply(
                "❌ Utilisation : `nvol @user` ou `nvol <id>`"
            );

        }


        // =================================================
        // SOI-MÊME
        // =================================================

        if (
            targetId === thiefId
        ) {

            return message.reply(
                "❌ Tu ne peux pas te voler toi-même."
            );

        }


        // =================================================
        // MEMBRE DU SERVEUR
        // =================================================

        const targetMember =
            await message.guild.members
                .fetch(targetId)
                .catch(() => null);


        if (!targetMember) {

            return message.reply(
                "❌ Cet utilisateur n'est pas sur le serveur."
            );

        }


        // =================================================
        // DONNÉES
        // =================================================

        const economy =
            loadJson(
                economyPath
            );

        const profiles =
            loadJson(
                profilesPath
            );

        const robbery =
            loadJson(
                robberyPath
            );


        // =================================================
        // COMPTES
        // =================================================

        if (!economy[thiefId]) {

            economy[thiefId] = {
                money: 500,
                lastDaily: 0
            };

        }

        if (!economy[targetId]) {

            economy[targetId] = {
                money: 500,
                lastDaily: 0
            };

        }


        const thiefMoney =
            Number(
                economy[thiefId].money || 0
            );

        const targetMoney =
            Number(
                economy[targetId].money || 0
            );


        // =================================================
        // CIBLE TROP PAUVRE
        // =================================================

        if (
            targetMoney < MIN_TARGET_MONEY
        ) {

            return message.reply(
                `💸 **${targetMember.user.username}** n'a pas assez de NebuCoins pour être volé.`
            );

        }


        // =================================================
        // COOLDOWN VOLEUR
        // =================================================

        const now =
            Date.now();


        const thiefData =
            robbery[thiefId];


        if (
            thiefData?.lastAttempt &&
            now - thiefData.lastAttempt <
                THIEF_COOLDOWN
        ) {

            const remaining =
                THIEF_COOLDOWN -
                (
                    now -
                    thiefData.lastAttempt
                );


            const minutes =
                Math.ceil(
                    remaining / 60000
                );


            return message.reply(
                `⏱️ Tu dois attendre encore **${minutes} min** avant de tenter un autre vol.`
            );

        }


        // =================================================
        // COOLDOWN CIBLE
        // =================================================

        const targetData =
            robbery[targetId];


        if (
            targetData?.lastRobbed &&
            now - targetData.lastRobbed <
                TARGET_COOLDOWN
        ) {

            const remaining =
                TARGET_COOLDOWN -
                (
                    now -
                    targetData.lastRobbed
                );


            const hours =
                Math.ceil(
                    remaining / 3600000
                );


            return message.reply(
                `🛡️ **${targetMember.user.username}** vient déjà d'être victime d'un vol. Tu ne peux pas le cibler pour le moment.`
            );

        }


        // =================================================
        // NIVEAUX
        // =================================================

        const thiefLevel =
            Number(
                profiles[thiefId]?.level || 1
            );

        const targetLevel =
            Number(
                profiles[targetId]?.level || 1
            );


        // =================================================
        // CHANCE DE BASE
        // =================================================

        let successChance =
            50;


        // Cible beaucoup plus riche
        if (
            targetMoney >=
            thiefMoney * 5
        ) {

            successChance += 5;

        }


        // Voleur déjà très riche
        if (
            thiefMoney >
            targetMoney * 2
        ) {

            successChance -= 5;

        }


        // Grosse différence de niveau
        if (
            targetLevel >=
            thiefLevel + 10
        ) {

            successChance -= 5;

        }

        if (
            thiefLevel >=
            targetLevel + 10
        ) {

            successChance += 3;

        }


        successChance =
            Math.max(
                25,
                Math.min(
                    60,
                    successChance
                )
            );


        // =================================================
        // ENREGISTRER LA TENTATIVE
        // =================================================

        robbery[thiefId] = {

            ...(robbery[thiefId] || {}),

            lastAttempt:
                now

        };


        robbery[targetId] = {

            ...(robbery[targetId] || {}),

            lastRobbed:
                now

        };


        // =================================================
        // TIRAGE
        // =================================================

        const roll =
            Math.random() * 100;


        // =================================================
        // ECHEC
        // =================================================

        if (
            roll >= successChance
        ) {

            const penalty =
                Math.max(
                    25,
                    Math.min(
                        150,
                        Math.floor(
                            thiefMoney * 0.02
                        )
                    )
                );


            const realPenalty =
                Math.min(
                    thiefMoney,
                    penalty
                );


            economy[thiefId].money -=
                realPenalty;


            saveJson(
                economyPath,
                economy
            );

            saveJson(
                robberyPath,
                robbery
            );


            return message.reply({

                embeds: [

                    {
                        color: 0xED4245,
                        title: "🚨 VOL RATÉ",
                        description:
                            `Tu as essayé de voler **${targetMember.user.username}**...\n\n` +
                            `💨 Il/elle t'a grillé.\n` +
                            `💸 Tu perds **${formatMoney(realPenalty)} NebuCoins**.\n\n` +
                            `🎲 Chance de réussite : **${successChance}%**`
                    }

                ]

            });

        }


        // =================================================
        // VOL RÉUSSI
        // =================================================

        const config =
            getStealConfig(
                targetMoney
            );


        const percent =
            config.minPercent +
            Math.random() *
            (
                config.maxPercent -
                config.minPercent
            );


        let stolen =
            Math.floor(
                targetMoney *
                percent
            );


        stolen =
            Math.min(
                stolen,
                config.cap
            );


        stolen =
            Math.min(
                stolen,
                targetMoney
            );


        if (
            stolen <= 0
        ) {

            return message.reply(
                "❌ Le vol n'a rien rapporté."
            );

        }


        // =================================================
        // TRANSFERT
        // =================================================

        economy[targetId].money -=
            stolen;

        economy[thiefId].money +=
            stolen;


        // =================================================
        // SAUVEGARDE
        // =================================================

        saveJson(
            economyPath,
            economy
        );

        saveJson(
            robberyPath,
            robbery
        );


        // =================================================
        // REPONSE
        // =================================================

        return message.reply({

            embeds: [

                {
                    color: 0x57F287,
                    title: "💰 VOL RÉUSSI",
                    description:
                        `Tu as réussi à voler **${targetMember.user.username}** !\n\n` +
                        `💸 **+${formatMoney(stolen)} NebuCoins**\n` +
                        `🎯 Chance : **${successChance}%**\n\n` +
                        `💳 Ton solde : **${formatMoney(economy[thiefId].money)} NebuCoins**`
                }

            ]

        });

    }

};