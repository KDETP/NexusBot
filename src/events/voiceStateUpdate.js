const {
    PermissionsBitField
} = require("discord.js");


// ==========================================
// RÔLES AUTORISÉS À REJOINDRE LES VOCALS PRIVÉS
// ==========================================

const PRIVATE_VOICE_ROLES = [
    "1457855405370900662",
    "1415339900445786183",
    "1465840162524102749",
    "1415340033627525201",
    "1415339976886980649",
    "1415339840198938664",
    "1415339765657764002"
];


// ==========================================
// ÉVÉNEMENT
// ==========================================

module.exports = async (
    client,
    oldState,
    newState
) => {

    // ======================================
    // SEULEMENT QUAND QUELQU'UN REJOINT
    // UN VOCAL
    // ======================================

    if (
        oldState.channelId ||
        !newState.channelId
    ) {

        return;

    }


    const channel =
        newState.channel;


    const member =
        newState.member;


    if (
        !channel ||
        !member
    ) {

        return;

    }


    // ======================================
    // IGNORER LES BOTS
    // ======================================

    if (
        member.user.bot
    ) {

        return;

    }


    // ======================================
    // VÉRIFIER SI LE VOCAL EST PRIVÉ
    // ======================================

    const everyoneOverwrite =
        channel.permissionOverwrites.cache.get(
            newState.guild.roles.everyone.id
        );


    if (
        !everyoneOverwrite
    ) {

        return;

    }


    const everyoneConnect =
        everyoneOverwrite.deny.has(
            PermissionsBitField.Flags.Connect
        );


    if (
        !everyoneConnect
    ) {

        return;

    }


    // ======================================
    // VÉRIFIER SI LA PERSONNE EST AUTORISÉE
    // ======================================

    const allowed =
        member.roles.cache.some(

            role =>
                PRIVATE_VOICE_ROLES.includes(
                    role.id
                )

        );


    if (
        allowed
    ) {

        return;

    }


    // ======================================
    // DÉCONNECTER
    // ======================================

    try {

        await member.voice.disconnect(
            "Vocal privé"
        );


    } catch (error) {

        console.error(
            "❌ Impossible de déconnecter le membre du vocal privé :",
            error
        );

        return;

    }


    // ======================================
    // MESSAGE PRIVÉ
    // ======================================

    try {

        await member.send({

            content:
`
🔒 **Vocal privé**

Le salon vocal **${channel.name}** est actuellement privé.

Tu ne peux pas rejoindre ce vocal pour le moment.
`

        });


    } catch (error) {

        console.log(
            `⚠️ Impossible d'envoyer un MP à ${member.user.tag}.`
        );

    }

};