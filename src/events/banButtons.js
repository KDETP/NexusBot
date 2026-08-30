const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS
// ==========================================

const BAN_ROLES = [
    "1457855405370900662",
    "1415339900445786183"
];


// ==========================================
// SALON LOGS
// ==========================================

const LOG_CHANNEL =
    "1415457668071555133";


// ==========================================
// RAISONS
// ==========================================

const REASONS = {

    spam:
        "Spam / Raid",

    troll:
        "Troll",

    insulte:
        "Insultes répétées",

    pub:
        "Publicité",

    inapproprie:
        "Contenu inapproprié",

    raid:
        "Raid",

    contournement:
        "Contournement de sanction",

    autre:
        "Autre"

};


// ==========================================
// DURÉES
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
// FORMAT DURÉE
// ==========================================

function formatDuration(
    value
) {

    const names = {

        "10m":
            "10 minutes",

        "15m":
            "15 minutes",

        "30m":
            "30 minutes",

        "45m":
            "45 minutes",

        "1h":
            "1 heure",

        "6h":
            "6 heures",

        "12h":
            "12 heures",

        "24h":
            "24 heures",

        permanent:
            "Permanente"

    };


    return (
        names[value] ||
        value
    );

}


// ==========================================
// HANDLER
// ==========================================

module.exports = async (
    client,
    interaction
) => {

    if (
        !interaction.isStringSelectMenu()
    ) {

        return;

    }


    const id =
        interaction.customId;


    // ======================================
    // CHOIX DE LA RAISON
    // ======================================

    if (
        id.startsWith(
            "ban_reason_"
        )
    ) {

        const parts =
            id.split("_");


        const targetId =
            parts[2];


        const moderatorId =
            parts[3];


        // ==============================
        // MODÉRATEUR
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
                    BAN_ROLES.includes(
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


        // ==================================
        // MENU DURÉE
        // ==================================

        const durationMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `ban_duration_${targetId}_${moderatorId}_${reasonKey}`
                )

                .setPlaceholder(
                    "⏱️ Choisis la durée du ban"
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
                    },

                    {
                        label: "Permanent",
                        value: "permanent",
                        emoji: "🔒"
                    }

                ]);


        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        "#ED4245"
                    )

                    .setTitle(
                        "⏱️ Durée du ban"
                    )

                    .setDescription(
`
👤 **Membre**

<@${targetId}>

📝 **Raison**

**${reason}**

━━━━━━━━━━━━━━━━━━

⏱️ **Choisis maintenant la durée du ban.**
`
                    )

                    .setFooter({

                        text:
                            "NebuBot • Modération"

                    })

            ],

            components: [

                new ActionRowBuilder()
                    .addComponents(
                        durationMenu
                    )

            ]

        });

    }


    // ======================================
    // CHOIX DE LA DURÉE
    // ======================================

    if (
        !id.startsWith(
            "ban_duration_"
        )
    ) {

        return;

    }


    const parts =
        id.split("_");


    const targetId =
        parts[2];


    const moderatorId =
        parts[3];


    const reasonKey =
        parts[4];


    // ======================================
    // MODÉRATEUR
    // ======================================

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


    // ======================================
    // PERMISSION
    // ======================================

    const allowed =
        interaction.member.roles.cache.some(

            role =>
                BAN_ROLES.includes(
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


    const reason =
        REASONS[reasonKey] ||
        "Autre";


    // ======================================
    // RÉCUPÉRER LE MEMBRE
    // ======================================

    let target;

    try {

        target =
            await interaction.guild.members.fetch(
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


    // ======================================
    // HIÉRARCHIE
    // ======================================

    if (
        target.roles.highest.position >=
        interaction.member.roles.highest.position
    ) {

        return interaction.reply({

            content:
                "❌ Tu ne peux pas bannir ce membre.",

            ephemeral: true

        });

    }


    // ======================================
    // PERMISSION BOT
    // ======================================

    if (
        !target.bannable
    ) {

        return interaction.reply({

            content:
                "❌ Je ne peux pas bannir ce membre.",

            ephemeral: true

        });

    }


    // ======================================
    // BAN
    // ======================================

    try {

        await target.ban({

            deleteMessageSeconds:
                0,

            reason:
                `${reason} | Modérateur : ${interaction.user.tag}`

        });

    } catch (error) {

        console.error(
            "❌ Erreur ban :",
            error
        );

        return interaction.reply({

            content:
                "❌ Impossible de bannir ce membre.",

            ephemeral: true

        });

    }


    // ======================================
    // EXPIRATION
    // ======================================

    let expirationText =
        "🔒 Permanente";


    if (
        durationKey !==
        "permanent"
    ) {

        const expires =
            Date.now() +
            DURATIONS[durationKey];


        expirationText =
            `<t:${Math.floor(expires / 1000)}:F>`;

    }


    // ======================================
    // LOG
    // ======================================

    const logChannel =
        interaction.guild.channels.cache.get(
            LOG_CHANNEL
        );


    if (logChannel) {

        const logEmbed =
            new EmbedBuilder()

                .setColor(
                    "#ED4245"
                )

                .setTitle(
                    "🔨 Membre banni"
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

**${target.user.tag}**

🆔 **ID**

\`${target.id}\`

━━━━━━━━━━━━━━━━━━

🛡️ **Banni par**

${interaction.user}

📝 **Raison**

**${reason}**

⏱️ **Durée**

**${formatDuration(durationKey)}**

🔓 **Expiration**

${expirationText}
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


    // ======================================
    // CONFIRMATION
    // ======================================

    return interaction.update({

        embeds: [

            new EmbedBuilder()

                .setColor(
                    "#57F287"
                )

                .setTitle(
                    "🔨 Ban effectué"
                )

                .setDescription(
`
👤 **Membre :** ${target.user.tag}

🛡️ **Modérateur :** ${interaction.user}

📝 **Raison :** ${reason}

⏱️ **Durée :** ${formatDuration(durationKey)}

🔓 **Expiration :** ${expirationText}
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

};