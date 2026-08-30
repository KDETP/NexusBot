const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// ROLES AUTORISÉS POUR LE TIMEOUT
// ==========================================

const TIMEOUT_ROLES = [
    "1415339976886980649",
    "1415340033627525201",
    "1465840162524102749",
    "1415339900445786183",
    "1457855405370900662"
];


// ==========================================
// SALON DES LOGS
// ==========================================

const LOG_CHANNEL =
    "1415457668071555133";


// ==========================================
// COMMANDE NUNTO
// ==========================================

module.exports = {

    name: "unto",

    description:
        "Retirer le timeout d'un membre.",


    async execute(message, args) {

        // ======================================
        // PERMISSION STAFF
        // ======================================

        const allowed =
            message.member.roles.cache.some(

                role =>
                    TIMEOUT_ROLES.includes(
                        role.id
                    )

            );


        if (!allowed) {

            return message.reply(
                "❌ Tu n'as pas la permission d'utiliser cette commande."
            );

        }


        // ======================================
        // ID OBLIGATOIRE
        // ======================================

        const targetId =
            args[0];


        if (!targetId) {

            return message.reply(
                "❌ Utilisation : `nunto ID_du_membre`"
            );

        }


        // ======================================
        // VERIFICATION ID
        // ======================================

        if (
            !/^\d{17,20}$/.test(targetId)
        ) {

            return message.reply(
                "❌ L'ID du membre est invalide."
            );

        }


        // ======================================
        // RECUPERER LE MEMBRE
        // ======================================

        let target;

        try {

            target =
                await message.guild.members.fetch(
                    targetId
                );

        } catch {

            return message.reply(
                "❌ Aucun membre avec cet ID n'a été trouvé sur le serveur."
            );

        }


        // ======================================
        // SELF
        // ======================================

        if (
            target.id ===
            message.author.id
        ) {

            return message.reply(
                "❌ Tu ne peux pas utiliser cette commande sur toi-même."
            );

        }


        // ======================================
        // HIERARCHIE
        // ======================================

        if (
            target.roles.highest.position >=
            message.member.roles.highest.position
        ) {

            return message.reply(
                "❌ Tu ne peux pas modérer un membre ayant un rôle supérieur ou égal au tien."
            );

        }


        // ======================================
        // VERIFIER LE TIMEOUT
        // ======================================

        if (
            !target.communicationDisabledUntilTimestamp ||
            target.communicationDisabledUntilTimestamp <= Date.now()
        ) {

            return message.reply(
                "ℹ️ Ce membre n'est actuellement pas en timeout."
            );

        }


        // ======================================
        // RETIRER LE TIMEOUT
        // ======================================

        try {

            await target.timeout(
                null,
                `Timeout retiré par ${message.author.tag}`
            );

        } catch (error) {

            console.error(
                "❌ Erreur retrait timeout :",
                error
            );

            return message.reply(
                "❌ Impossible de retirer le timeout."
            );

        }


        // ======================================
        // LOG
        // ======================================

        const logChannel =
            message.guild.channels.cache.get(
                LOG_CHANNEL
            );


        if (logChannel) {

            const logEmbed =
                new EmbedBuilder()

                    .setColor(
                        "#57F287"
                    )

                    .setTitle(
                        "🔓 Timeout retiré"
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

🆔 **ID**

\`${target.id}\`

━━━━━━━━━━━━━━━━━━

🛡️ **Retiré par**

${message.member}

━━━━━━━━━━━━━━━━━━

🔓 Le membre peut de nouveau parler normalement.
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

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#57F287"
                )

                .setTitle(
                    "🔓 Timeout retiré"
                )

                .setDescription(
`
👤 **Membre :** ${target}

🛡️ **Modérateur :** ${message.member}

✅ Le timeout a été retiré avec succès.
`
                )

                .setFooter({

                    text:
                        "NebuBot • Modération"

                })

                .setTimestamp();


        return message.reply({

            embeds: [
                embed
            ]

        });

    }

};