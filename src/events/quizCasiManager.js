const fs = require("fs");
const path = require("path");

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const trivia =
    require("../services/quiz/triviaManager");

const economyPath =
    path.join(
        __dirname,
        "..",
        "data",
        "economy.json"
    );

const REWARD =
    1000;


// ==========================================
// REPONSES DEJA DONNEES
// ==========================================

const answered =
    new Set();


module.exports = async (
    client,
    interaction
) => {

    // ==========================================
    // VERIFICATION
    // ==========================================

    if (
        !interaction.isButton()
    ) {

        return;

    }


    const customId =
        interaction.customId;


    if (
        !customId.startsWith(
            "quizcasi_"
        )
    ) {

        return;

    }


    if (
        customId.startsWith(
            "quizcasi_disabled_"
        )
    ) {

        return;

    }


    // ==========================================
    // RECUPERER LES INFORMATIONS
    // ==========================================

    const parts =
        customId.split("_");


    const key =
        parts[1];


    const answerIndex =
        Number(parts[2]);


    const buttonOwnerId =
        parts[3];


    if (
        !key ||
        !Number.isInteger(answerIndex) ||
        !buttonOwnerId
    ) {

        return interaction.reply({

            content:
                "❌ Ce Quiz Casino est invalide.",

            ephemeral: true

        });

    }


    // ==========================================
    // 🔒 VERIFICATION DU PROPRIETAIRE
    // ==========================================

    if (
        interaction.user.id !==
        buttonOwnerId
    ) {

        return interaction.reply({

            content:
                "❌ Ce Quiz Casino appartient à quelqu'un d'autre.",

            ephemeral: true

        });

    }


    // ==========================================
    // RECUPERER LE QUIZ
    // ==========================================

    const quiz =
        trivia.getQuiz(
            key
        );


    if (!quiz) {

        return interaction.reply({

            content:
                "❌ Ce Quiz Casino n'est plus disponible.",

            ephemeral: true

        });

    }


    // ==========================================
    // 🔒 DEUXIEME VERIFICATION
    // ==========================================

    if (
        String(quiz.userId) !==
        String(interaction.user.id)
    ) {

        return interaction.reply({

            content:
                "❌ Ce Quiz Casino appartient à quelqu'un d'autre.",

            ephemeral: true

        });

    }


    // ==========================================
    // DEJA REPONDU
    // ==========================================

    const userKey =
        `${interaction.message.id}_${interaction.user.id}`;


    if (
        answered.has(userKey)
    ) {

        return interaction.reply({

            content:
                "❌ Tu as déjà répondu à ce Quiz Casino.",

            ephemeral: true

        });

    }


    // ==========================================
    // VERIFICATION REPONSE
    // ==========================================

    if (
        answerIndex < 0 ||
        answerIndex >= quiz.answers.length
    ) {

        return interaction.reply({

            content:
                "❌ Cette réponse est invalide.",

            ephemeral: true

        });

    }


    answered.add(
        userKey
    );


    const correct =
        answerIndex ===
        quiz.correct;


    // ==========================================
    // BOUTONS RESULTAT
    // ==========================================

    const buttons =
        new ActionRowBuilder();


    quiz.answers.forEach(
        (answer, index) => {

            buttons.addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        `quizcasi_disabled_${index}`
                    )

                    .setLabel(
                        `${["A", "B", "C", "D"][index]} - ${answer}`
                    )

                    .setStyle(

                        index ===
                        quiz.correct

                            ? ButtonStyle.Success

                            : ButtonStyle.Danger

                    )

                    .setDisabled(
                        true
                    )

            );

        }
    );


    // ==========================================
    // DESACTIVER LES BOUTONS
    // ==========================================

    try {

        await interaction.update({

            components: [
                buttons
            ]

        });

    } catch (error) {

        console.error(
            "❌ Erreur mise à jour Quiz Casino :",
            error
        );

        return;

    }


    // ==========================================
    // SUPPRIMER LE QUIZ
    // ==========================================

    trivia.deleteQuiz(
        key
    );


    // ==========================================
    // ❌ MAUVAISE REPONSE
    // ==========================================

    if (!correct) {

        return interaction.followUp({

            content:
`❌ **Mauvaise réponse !**

💡 La bonne réponse était :

**${quiz.answers[quiz.correct]}**

━━━━━━━━━━━━━━━━━━

🎰 **Quiz Casino terminé.**

⏰ Prochaine tentative :
**dans 24h**`,

            ephemeral: true

        });

    }


    // ==========================================
    // ECONOMIE
    // ==========================================

    let economy;


    try {

        economy =
            JSON.parse(

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

        return interaction.followUp({

            content:
                "❌ Impossible de charger ton compte.",

            ephemeral: true

        });

    }


    const id =
        interaction.user.id;


    // ==========================================
    // CREER COMPTE
    // ==========================================

    if (!economy[id]) {

        economy[id] = {

            money: 500,

            lastDaily: 0

        };

    }


    // ==========================================
    // RECOMPENSE
    // ==========================================

    economy[id].money +=
        REWARD;


    // ==========================================
    // SAUVEGARDE
    // ==========================================

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
            "❌ Erreur sauvegarde économie :",
            error
        );

        return interaction.followUp({

            content:
                "❌ Impossible de sauvegarder ta récompense.",

            ephemeral: true

        });

    }


    // ==========================================
    // 🏆 VICTOIRE
    // ==========================================

    return interaction.followUp({

        content:
`🏆 **Bonne réponse !**

🎰 **Quiz Casino réussi !**

━━━━━━━━━━━━━━━━━━

💰 Récompense :
**+${REWARD} NebuCoins**

💳 Nouveau solde :
**${economy[id].money} NebuCoins**

━━━━━━━━━━━━━━━━━━

⏰ Prochaine tentative :
**dans 24h**

🍀 Bonne chance pour ton prochain casino !`,

        ephemeral: true

    });

};