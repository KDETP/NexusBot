const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS POUR LE KICK
// ==========================================

const KICK_ROLES = [
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
// COMMANDE NKICK
// ==========================================

module.exports = {

    name: "kick",

    description:
        "Expulser un membre du serveur.",


    async execute(message, args) {

        // ======================================
        // PERMISSION
        // ======================================

        const allowed =
            message.member.roles.cache.some(

                role =>
                    KICK_ROLES.includes(
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
                "❌ Utilisation : `nkick ID_du_membre`"
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
        // SELF KICK
        // ======================================

        if (
            target.id ===
            message.author.id
        ) {

            return message.reply(
                "❌ Tu ne peux pas t'expulser toi-même."
            );

        }


        // ======================================
        // BOT
        // ======================================

        if (
            target.user.bot
        ) {

            return message.reply(
                "❌ Tu ne peux pas expulser un bot avec cette commande."
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
                "❌ Tu ne peux pas expulser un membre ayant un rôle supérieur ou égal au tien."
            );

        }


        // ======================================
        // PERMISSION DU BOT
        // ======================================

        if (
            !target.kickable
        ) {

            return message.reply(
                "❌ Je ne peux pas expulser ce membre. Vérifie la position de mon rôle."
            );

        }


        // ======================================
        // MENU RAISON
        // ======================================

        const reasonMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `kick_reason_${target.id}_${message.author.id}`
                )

                .setPlaceholder(
                    "📝 Choisis la raison du kick"
                )

                .addOptions([

                    {
                        label: "Spam",
                        description:
                            "Messages répétitifs ou flood",
                        value: "spam",
                        emoji: "🟡"
                    },

                    {
                        label: "Troll",
                        description:
                            "Comportement perturbateur",
                        value: "troll",
                        emoji: "🟠"
                    },

                    {
                        label: "Soundboard abusif",
                        description:
                            "Utilisation abusive du soundboard",
                        value: "soundboard",
                        emoji: "🔊"
                    },

                    {
                        label: "Insulte",
                        description:
                            "Insulte ou manque de respect",
                        value: "insulte",
                        emoji: "🔴"
                    },

                    {
                        label: "Pub / Flood",
                        description:
                            "Publicité ou flood important",
                        value: "pub",
                        emoji: "📢"
                    },

                    {
                        label: "Provocation",
                        description:
                            "Provocation répétée",
                        value: "provocation",
                        emoji: "⚠️"
                    },

                    {
                        label: "Contenu inapproprié",
                        description:
                            "Contenu contraire au règlement",
                        value: "inapproprie",
                        emoji: "🚫"
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
                    "#FFA500"
                )

                .setTitle(
                    "👢 Action de modération"
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

📝 **Choisis la raison de l'expulsion**

Le membre sera expulsé après ton choix.
`
                )

                .setFooter({

                    text:
                        `Modérateur : ${message.author.tag}`

                })


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