const {
    ChannelType
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS
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

    name: "unlock",

    description:
        "Remettre le vocal en public.",


    async execute(message) {

        // ======================================
        // PERMISSION
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
        // REMETTRE LE VOCAL NORMAL
        // ======================================

        try {

            // Retire le blocage de @everyone
            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    Connect: null
                }
            );


            // Retire les permissions spéciales
            for (
                const roleId of PRIVATE_VOICE_ROLES
            ) {

                await message.channel.permissionOverwrites.delete(
                    roleId
                );

            }


            return message.reply(
                "🔓 **Vocal public !**\nTout le monde peut de nouveau rejoindre ce salon."
            );


        } catch (error) {

            console.error(
                "❌ Erreur nupv :",
                error
            );


            return message.reply(
                "❌ Impossible de remettre ce vocal en public."
            );

        }

    }

};