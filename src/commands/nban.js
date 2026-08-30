const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS POUR LE BAN
// ==========================================

const BAN_ROLES = [
    "1457855405370900662",
    "1415339900445786183"
];


// ==========================================
// COMMANDE NBAN
// ==========================================

module.exports = {

    name: "ban",

    description:
        "Bannir un membre du serveur.",


    async execute(message, args) {

        // ======================================
        // PERMISSION
        // ======================================

        const allowed =
            message.member.roles.cache.some(

                role =>
                    BAN_ROLES.includes(
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
                "❌ Utilisation : `nban ID_du_membre`"
            );

        }


        // ======================================
        // VÉRIFICATION ID
        // ======================================

        if (
            !/^\d{17,20}$/.test(targetId)
        ) {

            return message.reply(
                "❌ L'ID du membre est invalide."
            );

        }


        // ======================================
        // RÉCUPÉRER LE MEMBRE
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
        // SELF BAN
        // ======================================

        if (
            target.id ===
            message.author.id
        ) {

            return message.reply(
                "❌ Tu ne peux pas te bannir toi-même."
            );

        }


        // ======================================
        // BOT
        // ======================================

        if (
            target.user.bot
        ) {

            return message.reply(
                "❌ Tu ne peux pas bannir un bot avec cette commande."
            );

        }


        // ======================================
        // HIÉRARCHIE
        // ======================================

        if (
            target.roles.highest.position >=
            message.member.roles.highest.position
        ) {

            return message.reply(
                "❌ Tu ne peux pas bannir un membre ayant un rôle supérieur ou égal au tien."
            );

        }


        // ======================================
        // PERMISSION BOT
        // ======================================

        if (
            !target.bannable
        ) {

            return message.reply(
                "❌ Je ne peux pas bannir ce membre. Vérifie la position de mon rôle."
            );

        }


        // ======================================
        // MENU RAISON
        // ======================================

        const reasonMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `ban_reason_${target.id}_${message.author.id}`
                )

                .setPlaceholder(
                    "📝 Choisis la raison du ban"
                )

                .addOptions([

                    {
                        label: "Spam / Raid",
                        description:
                            "Spam important ou participation à un raid",
                        value: "spam",
                        emoji: "🚨"
                    },

                    {
                        label: "Troll",
                        description:
                            "Comportement fortement perturbateur",
                        value: "troll",
                        emoji: "🟠"
                    },

                    {
                        label: "Insultes répétées",
                        description:
                            "Insultes ou harcèlement répété",
                        value: "insulte",
                        emoji: "🔴"
                    },

                    {
                        label: "Publicité",
                        description:
                            "Publicité ou promotion non autorisée",
                        value: "pub",
                        emoji: "📢"
                    },

                    {
                        label: "Contenu inapproprié",
                        description:
                            "Contenu contraire au règlement",
                        value: "inapproprie",
                        emoji: "🚫"
                    },

                    {
                        label: "Raid",
                        description:
                            "Participation à un raid",
                        value: "raid",
                        emoji: "⚔️"
                    },

                    {
                        label: "Contournement de sanction",
                        description:
                            "Contournement d'un ban ou timeout",
                        value: "contournement",
                        emoji: "🔒"
                    },

                    {
                        label: "Autre",
                        description:
                            "Autre raison",
                        value: "autre",
                        emoji: "✏️"
                    }

                ]);


        const row =
            new ActionRowBuilder()
                .addComponents(
                    reasonMenu
                );


        // ======================================
        // EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#ED4245"
                )

                .setTitle(
                    "🔨 Action de modération"
                )

                .setThumbnail(

                    target.user.displayAvatarURL({

                        dynamic: true,

                        size: 512

                    })

                )

                .setDescription(
`
👤 **Membre ciblé**

${target}

🆔 **ID**

\`${target.id}\`

━━━━━━━━━━━━━━━━━━

📝 **Choisis la raison du ban**

Le ban sera appliqué après ton choix.
`
                )

                .setFooter({

                    text:
                        `Modérateur : ${message.author.tag}`

                })

                .setTimestamp();


        return message.reply({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });

    }

};