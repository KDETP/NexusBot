const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS
// ==========================================

const KICK_ROLES = [
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


    if (
        !interaction.customId.startsWith(
            "kick_reason_"
        )
    ) {

        return;

    }


    // ======================================
    // INFOS
    // ======================================

    const parts =
        interaction.customId.split("_");


    const targetId =
        parts[2];


    const moderatorId =
        parts[3];


    // ======================================
    // VÉRIFIER LE MODÉRATEUR
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
                KICK_ROLES.includes(
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


    // ======================================
    // RAISON
    // ======================================

    const reasonKey =
        interaction.values[0];


    const reason =
        REASONS[reasonKey] ||
        "Autre";


    // ======================================
    // RÉCUPÉRER MEMBRE
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
                "❌ Tu ne peux pas expulser ce membre car son rôle est supérieur ou égal au tien.",

            ephemeral: true

        });

    }


    // ======================================
    // KICKABLE
    // ======================================

    if (
        !target.kickable
    ) {

        return interaction.reply({

            content:
                "❌ Je ne peux pas expulser ce membre.",

            ephemeral: true

        });

    }


    // ======================================
    // EXPULSION
    // ======================================

    try {

        await target.kick(
            `${reason} | Modérateur : ${interaction.user.tag}`
        );

    } catch (error) {

        console.error(
            "❌ Erreur kick :",
            error
        );

        return interaction.reply({

            content:
                "❌ Impossible d'expulser ce membre.",

            ephemeral: true

        });

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
                    "#FFA500"
                )

                .setTitle(
                    "👢 Membre expulsé"
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

🛡️ **Expulsé par**

${interaction.user}

📝 **Raison**

**${reason}**
`
                )

                .setFooter({

                    text:
                        "NebuBot • Modération"

                })


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
                    "👢 Membre expulsé"
                )

                .setDescription(
`
👤 **Membre :** ${target.user.tag}

🛡️ **Modérateur :** ${interaction.user}

📝 **Raison :** ${reason}

✅ L'expulsion a été effectuée.
`
                )

                .setFooter({

                    text:
                        "NebuBot • Modération"

                })

        ],

        components: []

    });

};