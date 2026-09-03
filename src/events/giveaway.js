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
            "❌ Impossible de lire giveaways.json :",
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
// MÉLANGER
// =====================================================

function shuffle(array) {

    const result =
        [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];

    }

    return result;
}


// =====================================================
// CRÉER LES BOUTONS DÉSACTIVÉS
// =====================================================

function createDisabledButtons(
    giveawayId
) {

    return (

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
                    )

                    .setDisabled(
                        true
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

                    .setDisabled(
                        true
                    )

            )

    );

}


// =====================================================
// TERMINER UN GIVEAWAY
// =====================================================

async function endGiveaway(
    client,
    giveawayId
) {

    const giveaways =
        loadGiveaways();


    const giveaway =
        giveaways[giveawayId];


    if (
        !giveaway ||
        giveaway.ended
    ) {

        return false;

    }


    try {

        // ================================================
        // SALON
        // ================================================

        const channel =
            await client.channels.fetch(
                giveaway.channelId
            );


        if (!channel) {

            console.log(
                `❌ Salon introuvable pour ${giveawayId}`
            );

            return false;

        }


        // ================================================
        // MESSAGE
        // ================================================

        const message =
            await channel.messages.fetch(
                giveaway.messageId
            );


        // ================================================
        // PARTICIPANTS
        // ================================================

        const participants =
            [
                ...new Set(
                    giveaway.participants || []
                )
            ];


        // ================================================
        // TIRAGE
        // ================================================

        const winners =
            shuffle(
                participants
            ).slice(

                0,

                Math.min(
                    giveaway.winners,
                    participants.length
                )

            );


        // ================================================
        // SAUVEGARDE
        // ================================================

        giveaway.ended =
            true;


        giveaway.endedAt =
            Date.now();


        giveaway.winnerIds =
            winners;


        saveGiveaways(
            giveaways
        );


        // ================================================
        // EMBED TERMINÉ
        // ================================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎉 GIVEAWAY TERMINÉ"
                )

                .setDescription(

                    [

                        `## 🎁 ${giveaway.prize}`,

                        "",

                        `👥 **Participants :** ${participants.length}`,

                        "",

                        winners.length > 0

                            ? `🏆 **Gagnant${winners.length > 1 ? "s" : ""} :** ${winners
                                .map(
                                    id => `<@${id}>`
                                )
                                .join(", ")}`

                            : "❌ **Aucun gagnant.** Pas assez de participants."

                    ].join("\n")

                )

                .setFooter({

                    text:
                        "Nébula • Giveaway terminé"

                })

                .setTimestamp();


        // ================================================
        // MODIFIER LE MESSAGE
        // ================================================

        await message.edit({

            embeds: [
                embed
            ],

            components: [

                createDisabledButtons(
                    giveawayId
                )

            ]

        });


        // ================================================
        // PING DES GAGNANTS
        // ================================================

        if (
            winners.length > 0
        ) {

            const mentions =
                winners
                    .map(
                        id => `<@${id}>`
                    )
                    .join(", ");


            await channel.send({

                content:
                    `🎉 Félicitations ${mentions} ! Vous avez gagné **${giveaway.prize}** !`,

                allowedMentions: {

                    users:
                        winners

                }

            });

        } else {

            await channel.send(

                `❌ Le giveaway **${giveaway.prize}** est terminé, mais aucun gagnant n'a pu être tiré.`

            );

        }


        console.log(
            `🎉 Giveaway terminé : ${giveawayId}`
        );


        return true;

    } catch (error) {

        console.error(
            `❌ Erreur fin giveaway ${giveawayId} :`,
            error
        );

        return false;

    }

}


// =====================================================
// REROLL
// =====================================================

async function rerollGiveaway(
    client,
    giveawayId
) {

    const giveaways =
        loadGiveaways();


    const giveaway =
        giveaways[giveawayId];


    if (!giveaway) {

        return false;

    }


    if (!giveaway.ended) {

        return false;

    }


    try {

        const channel =
            await client.channels.fetch(
                giveaway.channelId
            );


        if (!channel) {

            return false;

        }


        const message =
            await channel.messages.fetch(
                giveaway.messageId
            );


        // ================================================
        // ANCIENS GAGNANTS
        // ================================================

        const oldWinners =
            new Set(
                giveaway.winnerIds || []
            );


        // ================================================
        // NOUVEAUX CANDIDATS
        // ================================================

        const availableParticipants =
            [
                ...new Set(
                    (giveaway.participants || [])
                        .filter(
                            id =>
                                !oldWinners.has(id)
                        )
                )
            ];


        if (
            availableParticipants.length === 0
        ) {

            await channel.send(
                "❌ Impossible de faire un reroll : aucun autre participant n'est disponible."
            );

            return false;

        }


        // ================================================
        // NOUVEAUX GAGNANTS
        // ================================================

        const newWinners =
            shuffle(
                availableParticipants
            ).slice(

                0,

                Math.min(
                    giveaway.winners,
                    availableParticipants.length
                )

            );


        // ================================================
        // SAUVEGARDE
        // ================================================

        giveaway.winnerIds =
            newWinners;


        giveaway.rerolledAt =
            Date.now();


        saveGiveaways(
            giveaways
        );


        // ================================================
        // MISE À JOUR EMBED
        // ================================================

        const participants =
            [
                ...new Set(
                    giveaway.participants || []
                )
            ];


        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎉 GIVEAWAY TERMINÉ"
                )

                .setDescription(

                    [

                        `## 🎁 ${giveaway.prize}`,

                        "",

                        `👥 **Participants :** ${participants.length}`,

                        "",

                        `🏆 **Nouveau gagnant${newWinners.length > 1 ? "s" : ""} :** ${newWinners
                            .map(
                                id => `<@${id}>`
                            )
                            .join(", ")}`,

                        "",

                        "🎲 **Reroll effectué**"

                    ].join("\n")

                )

                .setFooter({

                    text:
                        "Nébula • Giveaway terminé"

                })

                .setTimestamp();


        await message.edit({

            embeds: [
                embed
            ],

            components: [

                createDisabledButtons(
                    giveawayId
                )

            ]

        });


        // ================================================
        // PING
        // ================================================

        const mentions =
            newWinners
                .map(
                    id => `<@${id}>`
                )
                .join(", ");


        await channel.send({

            content:
                `🎲 Nouveau tirage ! Félicitations ${mentions} ! Vous avez gagné **${giveaway.prize}** !`,

            allowedMentions: {

                users:
                    newWinners

            }

        });


        console.log(
            `🎲 Reroll giveaway : ${giveawayId}`
        );


        return true;

    } catch (error) {

        console.error(
            `❌ Erreur reroll giveaway ${giveawayId} :`,
            error
        );

        return false;

    }

}


// =====================================================
// VÉRIFIER LES GIVEAWAYS
// =====================================================

async function checkGiveaways(
    client
) {

    const giveaways =
        loadGiveaways();


    const now =
        Date.now();


    for (
        const [id, giveaway]
        of Object.entries(
            giveaways
        )
    ) {

        if (
            giveaway.ended
        ) {

            continue;

        }


        if (
            now >= giveaway.endAt
        ) {

            await endGiveaway(
                client,
                id
            );

        }

    }

}


// =====================================================
// MANAGER
// =====================================================

async function giveawayManager(
    client
) {

    if (
        client.giveawayManagerStarted
    ) {

        return;

    }


    client.giveawayManagerStarted =
        true;


    client.once(
        "clientReady",
        async () => {

            console.log(
                "🎁 Giveaway Manager activé."
            );


            await checkGiveaways(
                client
            );


            setInterval(

                async () => {

                    await checkGiveaways(
                        client
                    );

                },

                5000

            );

        }
    );

}


// =====================================================
// EXPORTS
// =====================================================

module.exports =
    giveawayManager;

module.exports.endGiveaway =
    endGiveaway;

module.exports.rerollGiveaway =
    rerollGiveaway;