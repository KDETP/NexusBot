const trivia =
    require("../services/quiz/triviaManager");


module.exports = {

    name: "quiz",


    async execute(message) {

        // ======================================
        // RECUPERER QUESTION INTERNET
        // ======================================

        let quiz;


        try {

            quiz =
                await trivia.fetchQuestion();

        } catch (error) {

            console.error(
                "Erreur Open Trivia DB :",
                error
            );


            if (
                error.message ===
                "RATE_LIMIT"
            ) {

                return message.reply(
                    "⏳ Le service de questions est temporairement limité. Réessaie dans quelques secondes."
                );

            }


            return message.reply(
                "❌ Impossible de récupérer une question pour le moment."
            );

        }


        // ======================================
        // CREER IDENTIFIANT
        // ======================================

        const key =
            trivia.createQuiz(
                message.author.id,
                quiz,
                "normal"
            );


        // ======================================
        // BOUTONS
        // ======================================

        const {
            ActionRowBuilder,
            ButtonBuilder,
            ButtonStyle
        } = require("discord.js");


        const letters = [
            "A",
            "B",
            "C",
            "D"
        ];


        const row =
            new ActionRowBuilder();


        quiz.answers.forEach(
            (answer, index) => {

                row.addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `quiz_${key}_${index}`
                        )

                        .setLabel(
                            `${letters[index]} - ${answer}`
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        )

                );

            }
        );


        // ======================================
        // MESSAGE
        // ======================================

        return message.reply({

            content:
`🎮 **Nebu Quiz**

📚 Catégorie :
**${quiz.category}**

🧠 **${quiz.question}**

━━━━━━━━━━━━━━━━━━

🎯 Choisis ta réponse !`,

            components: [
                row
            ]

        });

    }

};