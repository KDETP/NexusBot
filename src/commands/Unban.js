const {
    EmbedBuilder
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS POUR LE DEBAN
// ==========================================

const BAN_ROLES = [
    "1457855405370900662",
    "1415339900445786183",
    "1538951826798551171"
];


// ==========================================
// COMMANDE NUNBAN
// ==========================================

module.exports = {

    name: "unban",

    description:
        "Débannir un utilisateur du serveur.",


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
                "❌ Utilisation : `nunban ID_du_membre`"
            );

        }


        // ======================================
        // VÉRIFICATION ID
        // ======================================

        if (
            !/^\d{17,20}$/.test(
                targetId
            )
        ) {

            return message.reply(
                "❌ L'ID du membre est invalide."
            );

        }


        // ======================================
        // VÉRIFIER SI L'UTILISATEUR EST BANNI
        // ======================================

        let banInfo;

        try {

            banInfo =
                await message.guild.bans.fetch(
                    targetId
                );

        } catch {

            return message.reply(
                "❌ Cet utilisateur n'est pas banni du serveur."
            );

        }


        // ======================================
        // DEBAN
        // ======================================

        try {

            await message.guild.members.unban(
                targetId,
                `Déban par ${message.author.tag}`
            );


        } catch (error) {

            console.error(
                "❌ Erreur lors du déban :",
                error
            );

            return message.reply(
                "❌ Impossible de débannir cet utilisateur. Vérifie que j'ai la permission **Bannir des membres**."
            );

        }


        // ======================================
        // EMBED
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#57F287"
                )

                .setTitle(
                    "✅ Utilisateur débanni"
                )

                .setDescription(

`👤 **Utilisateur**

\`${banInfo.user.tag}\`

🆔 **ID**

\`${targetId}\`

━━━━━━━━━━━━━━━━━━

✅ L'utilisateur peut maintenant rejoindre le serveur à nouveau.
`

                )

                .setFooter({

                    text:
                        `Modérateur : ${message.author.tag}`

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