const {
    ChannelType
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS À UTILISER NPV / NUPV
// ==========================================

const PRIVATE_VOICE_ROLES = [
    "1457855405370900662",
    "1415339900445786183",
    "1465840162524102749",
    "1415340033627525201",
    "1415339976886980649",
    "1415339840198938664",
    "1415339765657764002",
];


module.exports = {

    name: "pv",

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

        if (
            message.channel.type !==
            ChannelType.GuildVoice
        ) {

            return message.reply(
                "❌ Utilise cette commande dans le chat du salon vocal."
            );

        }


        // ======================================
        // PRIVATISER LE VOCAL
        // ======================================

        try {

            // Bloque @everyone
            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    Connect: false
                }
            );


            // Autorise les 7 rôles
            for (
                const roleId of PRIVATE_VOICE_ROLES
            ) {

                await message.channel.permissionOverwrites.edit(
                    roleId,
                    {
                        Connect: true
                    }
                );

            }


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