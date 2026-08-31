const {
    PermissionFlagsBits
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS À UTILISER NPV / LOCK
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

    name: "lock",

    description:
        "Rendre le vocal privé.",


    async execute(message) {

        // ======================================
        // PERMISSION COMMANDE
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
        // VÉRIFIER LE VOCAL
        // ======================================

        const voiceChannel =
            message.member.voice.channel;


        if (!voiceChannel) {

            return message.reply(
                "❌ Tu dois être connecté à un salon vocal."
            );

        }


        // ======================================
        // PRIVATISER LE VOCAL
        // ======================================

        try {

            // ==================================
            // RÉCUPÉRER LES RÔLES
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

                    validRoles.push(role);

                } else {

                    console.warn(
                        `⚠️ Rôle NPV introuvable : ${roleId}`
                    );

                }

            }


            // ==================================
            // BLOQUER @EVERYONE
            // ==================================

            await voiceChannel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    [PermissionFlagsBits.Connect]: false
                }
            );


            // ==================================
            // AUTORISER LES RÔLES VALIDES
            // ==================================

            for (
                const role of validRoles
            ) {

                await voiceChannel.permissionOverwrites.edit(
                    role,
                    {
                        [PermissionFlagsBits.Connect]: true
                    }
                );

            }


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