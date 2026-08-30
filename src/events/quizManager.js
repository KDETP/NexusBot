const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


const trivia =
    require("../services/quiz/triviaManager");


const fs =
    require("fs");


const path =
    require("path");


const profilesPath =
    path.join(
        __dirname,
        "..",
        "data",
        "profiles.json"
    );


// ==========================================
// REPONSES DEJA DONNEES
// ==========================================

const answered =
    new Set();


module.exports = async (
    client,
    interaction
) => {

    // ======================================
    // VERIFICATION
    // ======================================

    if (
        !interaction.isButton()
    ) {

        return;

    }


    if (
        !interaction.customId.startsWith(
            "quiz_"
        )
    ) {

        return;

    }


    if (
        interaction.customId.startsWith(
            "quiz_disabled_"
        )
    ) {

        return;

    }


    // ======================================
    // INFOS
    // ======================================

    const parts =
        interaction.customId.split("_");


    const key =
        parts[1];


    const answerIndex =
        Number(parts[2]);


    const userKey =
        `${interaction.message.id}_${interaction.user.id}`;


    // ======================================
    // DEJA REPONDU
    // ======================================

    if (
        answered.has(userKey)
    ) {

        return interaction.reply({

            content:
                "❌ Tu as déjà répondu à ce quiz.",

            ephemeral: true

        });

    }


    // ======================================
    // RECUPERER QUIZ
    // ======================================

    const quiz =
        trivia.getQuiz(key);


    if (!quiz) {

        return interaction.reply({

            content:
                "❌ Ce quiz n'est plus disponible. Lance `nquiz` pour obtenir une nouvelle question.",

            ephemeral: true

        });

    }


    // ======================================
    // SEUL LE JOUEUR QUI A LANCE
    // PEUT REPONDRE
    // ======================================

    if (
        quiz.userId !==
        interaction.user.id
    ) {

        return interaction.reply({

            content:
                "❌ Cette question appartient à quelqu'un d'autre.",

            ephemeral: true

        });

    }


    // ======================================
    // MARQUER REPONSE
    // ======================================

    answered.add(userKey);


    // ======================================
    // VERIFICATION
    // ======================================

    const correct =
        answerIndex === quiz.correct;


    // ======================================
    // BOUTONS RESULTAT
    // ======================================

    const buttons =
        new ActionRowBuilder();


    quiz.answers.forEach(
        (answer, index) => {

            buttons.addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        `quiz_disabled_${index}`
                    )

                    .setLabel(
                        `${["A", "B", "C", "D"][index]} - ${answer}`
                    )

                    .setStyle(

                        index === quiz.correct

                            ? ButtonStyle.Success

                            : ButtonStyle.Danger

                    )

                    .setDisabled(true)

            );

        }
    );


    // ======================================
    // UPDATE
    // ======================================

    await interaction.update({

        components: [
            buttons
        ]

    });


    // ======================================
    // SUPPRESSION QUIZ
    // ======================================

    trivia.deleteQuiz(key);


    // ======================================
    // MAUVAISE REPONSE
    // ======================================

    if (!correct) {

        return interaction.followUp({

            content:
`❌ **Mauvaise réponse ${interaction.user}.**

💡 La bonne réponse était :

**${quiz.answers[quiz.correct]}**`

        });

    }


    // ======================================
    // PROFILS
    // ======================================

    const profiles =
        JSON.parse(

            fs.readFileSync(
                profilesPath,
                "utf8"
            )

        );


    const id =
        interaction.user.id;


    // ======================================
    // CREATION PROFIL
    // ======================================

    if (!profiles[id]) {

        profiles[id] = {

            level: 1,

            xp: 0,

            quiz: 0,

            work: 0,

            casino: 0

        };

    }


    // ======================================
    // +1 QUIZ GAGNE
    // ======================================

    profiles[id].quiz += 1;


    // ======================================
    // SAUVEGARDE
    // ======================================

    fs.writeFileSync(

        profilesPath,

        JSON.stringify(
            profiles,
            null,
            2
        )

    );


    // ======================================
    // VICTOIRE
    // ======================================

    return interaction.followUp({

        content:
`🏆 **Bonne réponse ${interaction.user} !**

✅ Excellent !

📊 Quiz gagnés :
**${profiles[id].quiz}**`

    });

};