const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// ECONOMIE
// ==========================================

const economyPath = path.join(
    __dirname,
    "..",
    "data",
    "economy.json"
);


// ==========================================
// COMMANDE
// ==========================================

module.exports = {

    name: "top",


    async execute(message) {

        // ======================================
        // CHARGER ECONOMIE
        // ======================================

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
                "Erreur chargement economy.json :",
                error
            );

            return message.reply(
                "❌ Impossible de charger le classement."
            );

        }


        // ======================================
        // RECUPERER LES JOUEURS
        // ======================================

        const players = [];


        for (
            const [id, data]
            of Object.entries(economy)
        ) {

            // Vérification
            if (
                !data ||
                typeof data.money !== "number"
            ) {

                continue;

            }


            players.push({

                id,

                money:
                    data.money

            });

        }


        // ======================================
        // TRI DU PLUS RICHE AU PLUS PAUVRE
        // ======================================

        players.sort(

            (a, b) =>
                b.money - a.money

        );


        // ======================================
        // TOP 10
        // ======================================

        const topPlayers =
            players.slice(0, 10);


        // ======================================
        // AUCUN JOUEUR
        // ======================================

        if (
            topPlayers.length === 0
        ) {

            return message.reply(
                "❌ Aucun joueur n'est encore présent dans le classement."
            );

        }


        // ======================================
        // RECUPERER LES MEMBRES
        // ======================================

        try {

            await message.guild.members.fetch();

        } catch (error) {

            console.error(
                "Impossible de récupérer les membres :",
                error
            );

        }


        // ======================================
        // GENERER LE CLASSEMENT
        // ======================================

        let ranking = "";


        for (
            let index = 0;
            index < topPlayers.length;
            index++
        ) {

            const player =
                topPlayers[index];


            const member =
                message.guild.members.cache.get(
                    player.id
                );


            // ==================================
            // NOM DU JOUEUR
            // ==================================

            let name;


            if (member) {

                name =
                    member.displayName;

            } else {

                name =
                    "Joueur inconnu";

            }


            // ==================================
            // FORMATTAGE ARGENT
            // ==================================

            const money =
                player.money.toLocaleString(
                    "fr-FR"
                );


            // ==================================
            // MEDAILLES
            // ==================================

            let position;


            if (index === 0) {

                position = "🥇";

            } else if (index === 1) {

                position = "🥈";

            } else if (index === 2) {

                position = "🥉";

            } else {

                position =
                    `**${index + 1}.**`;

            }


            // ==================================
            // AJOUT
            // ==================================

            ranking +=
`${position} **${name}**
💰 ${money} NebuCoins

`;

        }


        // ======================================
        // EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor("#8B5CF6")

                .setTitle(
                    "🏆 Nebu Casino — Classement"
                )

                .setDescription(
`💰 **Les joueurs les plus riches de NebuBot**

━━━━━━━━━━━━━━━━━━

${ranking}━━━━━━━━━━━━━━━━━━

🎰 Continue à jouer pour monter dans le classement !`
                )

                .setFooter({

                    text:
                        `Top ${topPlayers.length} • Nebu Casino`

                })


        // ======================================
        // ENVOYER
        // ======================================

        return message.reply({

            embeds: [
                embed
            ]

        });

    }

};