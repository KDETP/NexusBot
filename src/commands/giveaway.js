const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const giveawaysFile = path.join(
    __dirname,
    "..",
    "data",
    "giveaways.json"
);


// =====================================================
// CHARGER
// =====================================================

function loadGiveaways() {

    if (!fs.existsSync(giveawaysFile)) {

        fs.writeFileSync(
            giveawaysFile,
            "{}",
            "utf8"
        );

    }

    try {

        return JSON.parse(
            fs.readFileSync(
                giveawaysFile,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ Erreur lecture giveaways.json :",
            error
        );

        return {};

    }

}


// =====================================================
// SAUVEGARDER
// =====================================================

function saveGiveaways(data) {

    fs.writeFileSync(
        giveawaysFile,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );

}


// =====================================================
// PARSER LA DURÉE
// =====================================================

function parseDuration(input) {

    const match =
        /^(\d+)\s*(s|m|h|d|w)$/i.exec(
            input
        );

    if (!match) {
        return null;
    }

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    const multipliers = {

        s: 1000,

        m: 60 * 1000,

        h: 60 * 60 * 1000,

        d: 24 * 60 * 60 * 1000,

        w: 7 * 24 * 60 * 60 * 1000

    };

    return (
        amount *
        multipliers[unit]
    );

}


// =====================================================
// COMMANDE
// =====================================================

module.exports = {

    name: "giveaway",

    async execute(message, args) {

        // =================================================
        // PERMISSION
        // =================================================

        if (
            !message.member.permissions.has(
                "ManageGuild"
            )
        ) {

            return message.reply(
                "❌ Tu dois avoir la permission **Gérer le serveur** pour gérer les giveaways."
            );

        }


        // =================================================
        // AIDE
        // =================================================

        if (
            !args ||
            !args.length
        ) {

            return message.reply(

                [
                    "**🎉 Système Giveaway**",
                    "",
                    "**Créer :**",
                    "`ngiveaway <durée> <gagnants> <récompense>`",
                    "",
                    "**Exemple :**",
                    "`ngiveaway 24h 2 1000 NebuCoins`",
                    "",
                    "**Terminer manuellement :**",
                    "`ngiveaway end <id>`",
                    "",
                    "**Relancer le tirage :**",
                    "`ngiveaway reroll <id>`",
                    "",
                    "**Voir les giveaways :**",
                    "`ngiveaway list`",
                    "",
                    "**Durées :**",
                    "`30s` `10m` `2h` `7d`",
                    "",
                    "**Maximum :** `30 jours`"
                ].join("\n")

            );

        }


        const subCommand =
            args[0].toLowerCase();


        // =================================================
        // LIST
        // =================================================

        if (
            subCommand === "list"
        ) {

            const giveaways =
                loadGiveaways();


            const entries =
                Object.values(
                    giveaways
                );


            if (
                !entries.length
            ) {

                return message.reply(
                    "📭 Aucun giveaway enregistré."
                );

            }


            const active =
                entries.filter(
                    giveaway =>
                        !giveaway.ended
                );


            const ended =
                entries.filter(
                    giveaway =>
                        giveaway.ended
                );


            if (
                !active.length
            ) {

                return message.reply(
                    "📭 Aucun giveaway actif actuellement."
                );

            }


            const lines =
                active.map(
                    giveaway => {

                        const remaining =
                            Math.max(
                                0,
                                giveaway.endAt - Date.now()
                            );

                        const seconds =
                            Math.floor(
                                remaining / 1000
                            );

                        const minutes =
                            Math.floor(
                                seconds / 60
                            );

                        const hours =
                            Math.floor(
                                minutes / 60
                            );

                        let durationText;

                        if (
                            hours > 0
                        ) {

                            durationText =
                                `${hours}h`;

                        } else if (
                            minutes > 0
                        ) {

                            durationText =
                                `${minutes}m`;

                        } else {

                            durationText =
                                `${seconds}s`;

                        }


                        return (
                            `• \`${giveaway.id}\` — **${giveaway.prize}** — ${giveaway.participants?.length || 0} participant(s) — fin dans **${durationText}**`
                        );

                    }
                );


            return message.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#8B5CF6"
                        )

                        .setTitle(
                            "🎉 Giveaways actifs"
                        )

                        .setDescription(
                            lines.join("\n")
                        )

                        .setFooter({
                            text:
                                `Nébula • ${active.length} actif(s) • ${ended.length} terminé(s)`
                        })

                ]

            });

        }


        // =================================================
        // END
        // =================================================

        if (
            subCommand === "end"
        ) {

            const giveawayId =
                args[1];


            if (!giveawayId) {

                return message.reply(
                    "❌ Utilisation : `ngiveaway end <id>`"
                );

            }


            const giveawayManager =
                require(
                    "../events/giveaway.js"
                );


            if (
                typeof giveawayManager.endGiveaway !==
                "function"
            ) {

                return message.reply(
                    "❌ Le gestionnaire des giveaways n'est pas correctement chargé."
                );

            }


            const giveaways =
                loadGiveaways();


            if (
                !giveaways[giveawayId]
            ) {

                return message.reply(
                    "❌ Giveaway introuvable."
                );

            }


            if (
                giveaways[giveawayId].ended
            ) {

                return message.reply(
                    "❌ Ce giveaway est déjà terminé."
                );

            }


            await giveawayManager.endGiveaway(
                message.client,
                giveawayId
            );


            return message.reply(
                "✅ Giveaway terminé manuellement."
            );

        }


        // =================================================
        // REROLL
        // =================================================

        if (
            subCommand === "reroll"
        ) {

            const giveawayId =
                args[1];


            if (!giveawayId) {

                return message.reply(
                    "❌ Utilisation : `ngiveaway reroll <id>`"
                );

            }


            const giveawayManager =
                require(
                    "../events/giveaway.js"
                );


            if (
                typeof giveawayManager.rerollGiveaway !==
                "function"
            ) {

                return message.reply(
                    "❌ Le gestionnaire des giveaways n'est pas correctement chargé."
                );

            }


            const giveaways =
                loadGiveaways();


            const giveaway =
                giveaways[giveawayId];


            if (!giveaway) {

                return message.reply(
                    "❌ Giveaway introuvable."
                );

            }


            if (!giveaway.ended) {

                return message.reply(
                    "❌ Ce giveaway n'est pas encore terminé."
                );

            }


            await giveawayManager.rerollGiveaway(
                message.client,
                giveawayId
            );


            return message.reply(
                "🎲 Nouveau tirage effectué."
            );

        }


        // =================================================
        // CRÉATION
        // =================================================

        const duration =
            parseDuration(
                args[0]
            );


        if (!duration) {

            return message.reply(
                "❌ Durée invalide. Exemple : `24h`, `30m`, `7d`."
            );

        }


        // =================================================
        // GAGNANTS
        // =================================================

        const winners =
            Number(
                args[1]
            );


        if (
            !Number.isInteger(
                winners
            ) ||
            winners < 1 ||
            winners > 20
        ) {

            return message.reply(
                "❌ Le nombre de gagnants doit être compris entre **1 et 20**."
            );

        }


        // =================================================
        // RÉCOMPENSE
        // =================================================

        const prize =
            args
                .slice(2)
                .join(" ")
                .trim();


        if (!prize) {

            return message.reply(
                "❌ Indique une récompense."
            );

        }


        // =================================================
        // LIMITE
        // =================================================

        const maxDuration =
            30 *
            24 *
            60 *
            60 *
            1000;


        if (
            duration > maxDuration
        ) {

            return message.reply(
                "❌ La durée maximale est de **30 jours**."
            );

        }


        // =================================================
        // ID
        // =================================================

        const giveawayId =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;


        const endAt =
            Date.now() +
            duration;


        // =================================================
        // EMBED
        // =================================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎉 GIVEAWAY"
                )

                .setDescription(

                    [
                        `## 🎁 ${prize}`,
                        "",
                        `🏆 **Gagnant${winners > 1 ? "s" : ""} :** ${winners}`,
                        `⏰ **Fin :** <t:${Math.floor(endAt / 1000)}:R>`,
                        "",
                        "Clique sur le bouton ci-dessous pour participer !",
                        "",
                        "👥 **Participants :** 0"
                    ].join("\n")

                )

                .setFooter({

                    text:
                        "Nébula • Giveaway"

                })


        // =================================================
        // BOUTONS
        // =================================================

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `giveaway_join_${giveawayId}`
                        )

                        .setLabel(
                            "Participer"
                        )

                        .setEmoji(
                            "🎉"
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),


                    new ButtonBuilder()

                        .setCustomId(
                            `giveaway_leave_${giveawayId}`
                        )

                        .setLabel(
                            "Quitter"
                        )

                        .setEmoji(
                            "❌"
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                );


        // =================================================
        // ENVOI
        // =================================================

        const giveawayMessage =
            await message.channel.send({

                embeds: [
                    embed
                ],

                components: [
                    row
                ]

            });


        // =================================================
        // SAUVEGARDE
        // =================================================

        const giveaways =
            loadGiveaways();


        giveaways[giveawayId] = {

            id:
                giveawayId,

            guildId:
                message.guild.id,

            channelId:
                message.channel.id,

            messageId:
                giveawayMessage.id,

            hostId:
                message.author.id,

            prize:
                prize,

            winners:
                winners,

            endAt:
                endAt,

            participants:
                [],

            ended:
                false,

            winnerIds:
                []

        };


        saveGiveaways(
            giveaways
        );

    }

};