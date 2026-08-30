const fs = require("fs");
const path = require("path");

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const trivia =
    require("../services/quiz/triviaManager");

const profilesPath =
    path.join(
        __dirname,
        "..",
        "data",
        "profiles.json"
    );


// ==========================================
// CONFIGURATION
// ==========================================

const COOLDOWN =
    24 * 60 * 60 * 1000;

const REWARD =
    1000;


// ==========================================
// COMMANDE
// ==========================================

module.exports = {

    name: "quizcasi",

    async execute(message) {

        const userId =
            message.author.id;


        // ==========================================
        // PROFILS
        // ==========================================

        let profiles;

        try {

            profiles =
                JSON.parse(
                    fs.readFileSync(
                        profilesPath,
                        "utf8"
                    )
                );

        } catch (error) {

            console.error(
                "❌ Erreur lecture profiles.json :",
                error
            );

            return message.reply(
                "❌ Impossible de charger ton profil."
            );

        }


        // ==========================================
        // CREER PROFIL
        // ==========================================

        if (!profiles[userId]) {

            profiles[userId] = {

                level: 1,
                xp: 0,
                quiz: 0,
                work: 0,
                casino: 0,
                lastCasinoQuiz: 0

            };

        }


        // ==========================================
        // COMPATIBILITE
        // ==========================================

        if (
            typeof profiles[userId].lastCasinoQuiz !==
            "number"
        ) {

            profiles[userId].lastCasinoQuiz =
                0;

        }


        // ==========================================
        // COOLDOWN
        // ==========================================

        const now =
            Date.now();

        const elapsed =
            now -
            profiles[userId].lastCasinoQuiz;


        if (
            elapsed < COOLDOWN
        ) {

            const remaining =
                COOLDOWN -
                elapsed;

            const hours =
                Math.floor(
                    remaining / 3600000
                );

            const minutes =
                Math.floor(
                    (remaining % 3600000) / 60000
                );

            return message.reply(
`⏳ **Quiz Casino déjà utilisé !**

🎰 Tu as déjà tenté ton Quiz Casino aujourd'hui.

🕐 Prochaine tentative dans :

**${hours}h ${minutes}min**

💰 Tu pourras gagner **${REWARD} NebuCoins** à ton prochain Quiz Casino.`
            );

        }


        // ==========================================
        // RECUPERER QUESTION
        // ==========================================

        let quiz;

        try {

            quiz =
                await trivia.fetchQuestion();

        } catch (error) {

            console.error(
                "❌ Erreur récupération question :",
                error
            );

            return message.reply(
                "❌ Impossible de récupérer la question. Ton cooldown n'a pas été consommé, réessaie."
            );

        }


        // ==========================================
        // CREER SESSION
        // ==========================================

        const key =
            trivia.createQuiz(
                userId,
                quiz,
                "casino"
            );


        // ==========================================
        // ENREGISTRER COOLDOWN
        // ==========================================

        profiles[userId].lastCasinoQuiz =
            now;


        try {

            fs.writeFileSync(

                profilesPath,

                JSON.stringify(
                    profiles,
                    null,
                    2
                )

            );

        } catch (error) {

            console.error(
                "❌ Erreur sauvegarde profil :",
                error
            );

            trivia.deleteQuiz(
                key
            );

            return message.reply(
                "❌ Impossible de sauvegarder ton Quiz Casino."
            );

        }


        // ==========================================
        // BOUTONS
        // ==========================================

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
                            `quizcasi_${key}_${index}_${userId}`
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


        // ==========================================
        // MESSAGE
        // ==========================================

        return message.reply({

            content:
`🎰 **Quiz Casino Nébul**

👤 Joueur :
${message.author}

📚 Catégorie :
**${quiz.category}**

🧠 **${quiz.question}**

━━━━━━━━━━━━━━━━━━

💰 Récompense :
**+${REWARD} NebuCoins**

⏰ **Une tentative toutes les 24h**

🔒 **Seul ${message.author} peut répondre.**

🎯 Bonne chance !`,

            components: [
                row
            ]

        });

    }

};