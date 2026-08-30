const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");


// ==========================================
// ROLES AUTORISES POUR LE TIMEOUT
// ==========================================

const TIMEOUT_ROLES = [

    "1415339976886980649",
    "1415340033627525201",
    "1465840162524102749",
    "1415339900445786183",
    "1457855405370900662"

];


// ==========================================
// LOGS
// ==========================================

const LOG_CHANNEL =
    "1415457668071555133";


// ==========================================
// RAISONS
// ==========================================

const REASONS = {

    spam:
        "Spam",

    troll:
        "Troll",

    soundboard:
        "Soundboard abusif",

    insulte:
        "Insulte",

    pub:
        "Pub / Flood",

    provocation:
        "Provocation",

    inapproprie:
        "Contenu inapproprié",

    autre:
        "Autre"

};


// ==========================================
// DUREES
// ==========================================

const DURATIONS = {

    "10m":
        10 * 60 * 1000,

    "15m":
        15 * 60 * 1000,

    "30m":
        30 * 60 * 1000,

    "45m":
        45 * 60 * 1000,

    "1h":
        60 * 60 * 1000,

    "6h":
        6 * 60 * 60 * 1000,

    "12h":
        12 * 60 * 60 * 1000,

    "24h":
        24 * 60 * 60 * 1000

};


// ==========================================
// FORMAT DUREE
// ==========================================

function formatDuration(
    duration
) {

    if (
        duration === "10m"
    ) return "10 minutes";

    if (
        duration === "15m"
    ) return "15 minutes";

    if (
        duration === "30m"
    ) return "30 minutes";

    if (
        duration === "45m"
    ) return "45 minutes";

    if (
        duration === "1h"
    ) return "1 heure";

    if (
        duration === "6h"
    ) return "6 heures";

    if (
        duration === "12h"
    ) return "12 heures";

    if (
        duration === "24h"
    ) return "24 heures";

    return duration;

}


// ==========================================
// HANDLER
// ==========================================

module.exports = async (
    client,
    interaction
) => {

    // ======================================
    // SELECT MENU
    // ======================================

    if (
        !interaction.isStringSelectMenu()
    ) {

        return;

    }


    const id =
        interaction.customId;


    // ======================================
    // RAISON TIMEOUT
    // ======================================

    if (
        id.startsWith(
            "timeout_reason_"
        )
    ) {

        const parts =
            id.split("_");


        const targetId =
            parts[2];


        const moderatorId =
            parts[3];


        // ==============================
        // VERIFIER LE MODERATEUR
        // ==============================

        if (
            interaction.user.id !==
            moderatorId
        ) {

            return interaction.reply({

                content:
                    "❌ Ce menu appartient à un autre modérateur.",

                ephemeral: true

            });

        }


        // ==============================
        // VERIFIER ROLE
        // ==============================

        const allowed =
            interaction.member.roles.cache.some(

                role =>
                    TIMEOUT_ROLES.includes(
                        role.id
                    )

            );


        if (!allowed) {

            return interaction.reply({

                content:
                    "❌ Tu n'as pas la permission.",

                ephemeral: true

            });

        }


        const reasonKey =
            interaction.values[0];


        const reason =
            REASONS[reasonKey] ||
            "Autre";


        // ==============================
        // MENU DUREE
        // ==============================

        const durationMenu =
            new StringSelectMenuBuilder()

                .setCustomId(

                    `timeout_duration_${targetId}_${moderatorId}_${reasonKey}`

                )

                .setPlaceholder(
                    "⏱️ Choisis la durée"
                )

                .addOptions([

                    {
                        label: "10 minutes",
                        value: "10m",
                        emoji: "🟢"
                    },

                    {
                        label: "15 minutes",
                        value: "15m",
                        emoji: "🟢"
                    },

                    {
                        label: "30 minutes",
                        value: "30m",
                        emoji: "🟡"
                    },

                    {
                        label: "45 minutes",
                        value: "45m",
                        emoji: "🟠"
                    },

                    {
                        label: "1 heure",
                        value: "1h",
                        emoji: "🟠"
                    },

                    {
                        label: "6 heures",
                        value: "6h",
                        emoji: "🔴"
                    },

                    {
                        label: "12 heures",
                        value: "12h",
                        emoji: "🔴"
                    },

                    {
                        label: "24 heures",
                        value: "24h",
                        emoji: "🔴"
                    }

                ]);


        const row =
            new ActionRowBuilder()
                .addComponents(
                    durationMenu
                );


        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        "#FEE75C"
                    )

                    .setTitle(
                        "⏱️ Durée du timeout"
                    )

                    .setDescription(
`
👤 **Membre**

<@${targetId}>

📝 **Raison**

**${reason}**

━━━━━━━━━━━━━━━━━━

⏱️ Choisis maintenant la durée.
`
                    )

            ],

            components: [
                row
            ]

        });

    }


    // ======================================
    // DUREE TIMEOUT
    // ======================================

    if (
        id.startsWith(
            "timeout_duration_"
        )
    ) {

        const parts =
            id.split("_");


        const targetId =
            parts[2];


        const moderatorId =
            parts[3];


        const reasonKey =
            parts[4];


        // ==============================
        // MODERATEUR
        // ==============================

        if (
            interaction.user.id !==
            moderatorId
        ) {

            return interaction.reply({

                content:
                    "❌ Ce menu appartient à un autre modérateur.",

                ephemeral: true

            });

        }


        // ==============================
        // PERMISSION
        // ==============================

        const allowed =
            interaction.member.roles.cache.some(

                role =>
                    TIMEOUT_ROLES.includes(
                        role.id
                    )

            );


        if (!allowed) {

            return interaction.reply({

                content:
                    "❌ Tu n'as pas la permission.",

                ephemeral: true

            });

        }


        const durationKey =
            interaction.values[0];


        const duration =
            DURATIONS[
                durationKey
            ];


        const guild =
            interaction.guild;


        // ==============================
        // RECUPERER MEMBRE
        // ==============================

        let target;


        try {

            target =
                await guild.members.fetch(
                    targetId
                );

        } catch {

            return interaction.update({

                embeds: [

                    new EmbedBuilder()

                        .setColor(
                            "#ED4245"
                        )

                        .setTitle(
                            "❌ Membre introuvable"
                        )

                        .setDescription(
                            "Le membre n'est plus présent sur le serveur."
                        )

                ],

                components: []

            });

        }


        // ==============================
        // HIERARCHIE
        // ==============================

        if (
            target.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {

            return interaction.reply({

                content:
                    "❌ Tu ne peux pas modérer ce membre car son rôle est supérieur ou égal au tien.",

                ephemeral: true

            });

        }


        // ==============================
        // BOT
        // ==============================

        if (
            !target.moderatable
        ) {

            return interaction.reply({

                content:
                    "❌ Je ne peux pas mettre ce membre en timeout.",

                ephemeral: true

            });

        }


        const reason =
            REASONS[reasonKey] ||
            "Autre";


        // ==============================
        // APPLIQUER TIMEOUT
        // ==============================

        try {

            await target.timeout(

                duration,

                `${reason} | Modérateur : ${interaction.user.tag}`

            );

        } catch (error) {

            console.error(
                "❌ Erreur timeout :",
                error
            );

            return interaction.reply({

                content:
                    "❌ Impossible d'appliquer le timeout.",

                ephemeral: true

            });

        }


        // ==============================
        // DATE EXPIRATION
        // ==============================

        const expires =
            Date.now() +
            duration;


        const expiration =
            `<t:${Math.floor(expires / 1000)}:F>`;


        // ==============================
        // LOG
        // ==============================

        const logChannel =
            guild.channels.cache.get(
                LOG_CHANNEL
            );


        if (logChannel) {

            const logEmbed =
                new EmbedBuilder()

                    .setColor(
                        "#FEE75C"
                    )

                    .setTitle(
                        "🔨 Timeout appliqué"
                    )

                    .setThumbnail(

                        target.user.displayAvatarURL({

                            dynamic: true,

                            size: 512

                        })

                    )

                    .setDescription(
`
👤 **Membre**

${target}

━━━━━━━━━━━━━━━━━━

🛡️ **Modérateur**

${interaction.user}

📝 **Raison**

**${reason}**

⏱️ **Durée**

**${formatDuration(durationKey)}**

🔓 **Expiration**

${expiration}
`
                    )

                    .setFooter({

                        text:
                            "NebuBot • Modération"

                    })

                    .setTimestamp();


            await logChannel.send({

                embeds: [
                    logEmbed
                ]

            });

        }


        // ==============================
        // RESULTAT
        // ==============================

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        "#57F287"
                    )

                    .setTitle(
                        "✅ Timeout appliqué"
                    )

                    .setDescription(
`
👤 ${target}

📝 **Raison :** ${reason}

⏱️ **Durée :** ${formatDuration(durationKey)}

🔓 **Expire :** ${expiration}

🛡️ **Modérateur :** ${interaction.user}
`
                    )

                    .setFooter({

                        text:
                            "NebuBot • Modération"

                    })

                    .setTimestamp()

            ],

            components: []

        });

    }

};