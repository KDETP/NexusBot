const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// DOSSIER DES COMMANDES
// ==========================================

const commandsPath = __dirname;


// ==========================================
// DESCRIPTIONS PAR DEFAUT
// ==========================================

const descriptions = {

    balance:
        "Voir ton nombre de NebuCoins.",

    profil:
        "Voir ton profil NebuBot.",

    daily:
        "Récupérer ton bonus quotidien.",

    roulette:
        "Jouer à la roulette.",

    blackjack:
        "Jouer au blackjack.",

    slots:
        "Jouer aux machines à sous.",

    top:
        "Voir le classement des joueurs les plus riches.",

    quiz:
        "Répondre à une question aléatoire.",

    quizcasi:
        "Répondre au Quiz Casino et gagner des NebuCoins toutes les 24h.",

    ticket:
        "Créer ou gérer un ticket.",

    pp:
        "Afficher une image de profil.",

    blur:
        "Appliquer un effet flou à une image.",

    explode:
        "Faire exploser une image.",

    implode:
        "Appliquer un effet implode à une image.",

    pixel:
        "Pixeliser une image.",

    triggered:
        "Créer une image triggered.",

    wanted:
        "Créer une affiche Wanted.",

    ship:
        "Créer un ship entre deux personnes.",

    facepalm:
        "Créer une image facepalm.",

    trash:
        "Créer une image trash.",

    cat:
        "Afficher une image de chat."

};


// ==========================================
// COMMANDE NZ
// ==========================================

module.exports = {

    name: "z",

    description:
        "Afficher toutes les commandes de NebuBot en MP.",


    async execute(message) {

        // ======================================
        // RECUPERER LES FICHIERS
        // ======================================

        let files;

        try {

            files =
                fs.readdirSync(
                    commandsPath
                );

        } catch (error) {

            console.error(
                "Erreur lecture commandes :",
                error
            );

            return message.reply(
                "❌ Impossible de récupérer les commandes."
            );

        }


        // ======================================
        // RECUPERER LES COMMANDES
        // ======================================

        const commands = [];


        for (
            const file of files
        ) {

            if (
                !file.endsWith(".js")
            ) {

                continue;

            }


            if (
                file === "nz.js"
            ) {

                continue;

            }


            try {

                const command =
                    require(
                        path.join(
                            commandsPath,
                            file
                        )
                    );


                if (
                    !command ||
                    !command.name
                ) {

                    continue;

                }


                let description =
                    command.description;


                // ==================================
                // DESCRIPTION AUTOMATIQUE
                // ==================================

                if (
                    !description
                ) {

                    description =
                        descriptions[
                            command.name
                        ];

                }


                if (
                    !description
                ) {

                    description =
                        "Commande NebuBot.";

                }


                commands.push({

                    name:
                        command.name,

                    description

                });


            } catch (error) {

                console.error(

                    `Erreur avec ${file} :`,

                    error.message

                );

            }

        }


        // ======================================
        // TRI
        // ======================================

        commands.sort(

            (a, b) =>
                a.name.localeCompare(
                    b.name
                )

        );


        // ======================================
        // CREATION DES PAGES
        // ======================================

        const pages = [];


        let currentPage = "";


        for (
            const command
            of commands
        ) {

            const line =
`**n${command.name}**
→ ${command.description}

`;


            // Discord limite les embeds
            // à environ 4096 caractères
            if (
                currentPage.length +
                line.length >
                3500
            ) {

                pages.push(
                    currentPage
                );


                currentPage = "";

            }


            currentPage +=
                line;

        }


        if (
            currentPage.length > 0
        ) {

            pages.push(
                currentPage
            );

        }


        // ======================================
        // SI AUCUNE COMMANDE
        // ======================================

        if (
            pages.length === 0
        ) {

            return message.reply(
                "❌ Aucune commande trouvée."
            );

        }


        // ======================================
        // ENVOI DES EMBEDS EN MP
        // ======================================

        try {

            for (
                let i = 0;
                i < pages.length;
                i++
            ) {

                const embed =
                    new EmbedBuilder()

                        .setColor(
                            "#8B5CF6"
                        )

                        .setTitle(
                            i === 0
                                ? "🤖 NebuBot — Commandes"
                                : `🤖 NebuBot — Commandes (${i + 1}/${pages.length})`
                        )

                        .setDescription(
                            pages[i]
                        )

                        .setFooter({

                            text:
                                `NebuBot • ${commands.length} commandes`

                        });


                await message.author.send({

                    embeds: [
                        embed
                    ]

                });

            }


        } catch (error) {

            console.error(
                "Impossible d'envoyer les MP :",
                error
            );


            return message.reply(
`❌ Je n'ai pas réussi à t'envoyer les commandes en MP.

🔒 Vérifie que tes messages privés sont ouverts pour le serveur.`
            );

        }


        // ======================================
        // CONFIRMATION
        // ======================================

        return message.reply({

            content:
    "📩 Je t'ai envoyé les commandes en MP !",

            allowedMentions: {
                repliedUser: false
            }

        });

    }

};