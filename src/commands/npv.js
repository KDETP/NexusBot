const {
    PermissionFlagsBits,
    OverwriteType
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS À UTILISER NPV
// ==========================================

const PRIVATE_VOICE_ROLES = [

    "1457855405370900662", // 👑 Couronne
    "1452142914099478630", // •
    "1415339765657764002", // 🛡️ Staff basic
    "1415339840198938664", // 👑 Admin
    "1415339900445786183"  // 🛡️ Responsable Staff

];


// ==========================================
// COMMANDE
// ==========================================

module.exports = {

    name: "npv",

    description:
        "Rendre le vocal privé.",


    async execute(message) {


        // ======================================
        // VÉRIFICATION DES PERMISSIONS
        // ======================================

        const allowed =
            message.member.roles.cache.some(
                role =>
                    PRIVATE_VOICE_ROLES.includes(
                        role.id
                    )
            );


        if (!allowed) {

            return message.reply(
                "❌ Tu n'as pas l'autorisation."
            );

        }


        // ======================================
        // RÉCUPÉRER LE VOCAL
        // ======================================

        const voiceChannel =
            message.member.voice.channel;


        if (!voiceChannel) {

            return message.reply(
                "❌ Tu dois être connecté à un salon vocal."
            );

        }


        try {


            // ==================================
            // RÉCUPÉRER LES RÔLES EXISTANTS
            // ==================================

            const validRoles = [];


            for (
                const roleId of PRIVATE_VOICE_ROLES
            ) {

                const role =
                    await message.guild.roles
                        .fetch(roleId)
                        .catch(() => null);


                if (role) {

                    validRoles.push(
                        role
                    );

                } else {

                    console.warn(
                        `⚠️ Rôle NPV introuvable : ${roleId}`
                    );

                }

            }


            // ==================================
            // CONSTRUIRE LES PERMISSIONS
            // ==================================

            const overwrites = [

                // @everyone
                {

                    id:
                        message.guild.id,

                    type:
                        OverwriteType.Role,

                    deny: [

                        PermissionFlagsBits.Connect

                    ]

                }

            ];


            // ==================================
            // AUTORISER LES RÔLES STAFF
            // ==================================

            for (
                const role of validRoles
            ) {

                overwrites.push({

                    id:
                        role.id,

                    type:
                        OverwriteType.Role,

                    allow: [

                        PermissionFlagsBits.Connect

                    ]

                });

            }


            // ==================================
            // APPLIQUER LES PERMISSIONS
            // ==================================

            await voiceChannel.permissionOverwrites.set(
                overwrites
            );


            // ==================================
            // RÉPONSE
            // ==================================

            return message.reply(
                "🔒 **Vocal privé !**\nSeuls les rôles autorisés peuvent rejoindre ce salon."
            );


        } catch (error) {

            console.error(
                "❌ Erreur npv :",
                error
            );


            return message.reply(
                "❌ Impossible de privatiser ce vocal."
            );

        }

    }

};