const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
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
// COMMANDE NTO
// ==========================================

module.exports = {

    name: "to",

    description:
        "Mettre un membre en timeout.",


    async execute(message, args) {

        // ======================================
        // PERMISSION STAFF
        // ======================================

        const allowed =
            message.member.roles.cache.some(
                role =>
                    TIMEOUT_ROLES.includes(role.id)
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
                "❌ Utilisation : `nto ID_du_membre`"
            );

        }


        // ======================================
        // VERIFIER QUE C'EST BIEN UN ID
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
        // SELF TIMEOUT
        // ======================================

        if (
            target.id === message.author.id
        ) {

            return message.reply(
                "❌ Tu ne peux pas te mettre toi-même en timeout."
            );

        }


        // ======================================
        // BOT
        // ======================================

        if (
            target.user.bot
        ) {

            return message.reply(
                "❌ Tu ne peux pas mettre un bot en timeout."
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
        // PERMISSION DU BOT
        // ======================================

        if (
            !target.moderatable
        ) {

            return message.reply(
                "❌ Je ne peux pas mettre ce membre en timeout. Vérifie la position de mon rôle."
            );

        }


        // ======================================
        // MENU DES RAISONS
        // ======================================

        const reasonMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `timeout_reason_${target.id}_${message.author.id}`
                )

                .setPlaceholder(
                    "📝 Choisis la raison du timeout"
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
                    "#FEE75C"
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

📝 **Choisis la raison du timeout**
`
                )

                .setFooter({

                    text:
                        `Modérateur : ${message.author.tag}`

                });


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