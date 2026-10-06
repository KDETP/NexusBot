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
// VOCALS ACTUELLEMENT VERROUILLÉS
// ==========================================
//
// IMPORTANT :
// Ce système ne modifie AUCUNE permission Discord.
//
// Le Set sert uniquement à dire au
// voiceStateUpdate.js qu'une voc est verrouillée.
//

const privateVoiceChannels =
    new Set();


// Export utilisé par voiceStateUpdate.js
module.exports.privateVoiceChannels =
    privateVoiceChannels;


// ==========================================
// VÉRIFIER SI L'UTILISATEUR EST AUTORISÉ
// ==========================================

function hasPrivateVoicePermission(
    member
) {

    if (!member) {

        return false;

    }


    return member.roles.cache.some(

        role =>
            PRIVATE_VOICE_ROLES.includes(
                role.id
            )

    );

}


// ==========================================
// COMMANDE NPV
// ==========================================

module.exports.executePrivateVoice =
    async function (message) {


        // ======================================
        // PERMISSION
        // ======================================

        const allowed =
            hasPrivateVoicePermission(
                message.member
            );


        if (!allowed) {

            return message.reply(
                "❌ Tu n'as pas l'autorisation d'utiliser cette commande."
            );

        }


        // ======================================
        // VOCAL
        // ======================================

        const voiceChannel =
            message.member.voice.channel;


        if (!voiceChannel) {

            return message.reply(
                "❌ Tu dois être connecté à un salon vocal."
            );

        }


        // ======================================
        // VÉRIFIER L'ÉTAT ACTUEL
        // ======================================

        const isPrivate =
            privateVoiceChannels.has(
                voiceChannel.id
            );


        // ======================================
        // UNLOCK
        // ======================================

        if (isPrivate) {

            privateVoiceChannels.delete(
                voiceChannel.id
            );


            return message.reply(
                "🔓 **Vocal déverrouillé !**\nLes membres peuvent de nouveau rejoindre normalement."
            );

        }


        // ======================================
        // LOCK
        // ======================================

        privateVoiceChannels.add(
            voiceChannel.id
        );


        return message.reply(
            "🔒 **Vocal verrouillé !**\nLes membres non autorisés seront automatiquement déconnectés s'ils essaient de rejoindre."
        );

    };


// ==========================================
// INFORMATIONS
// ==========================================

module.exports.name =
    "pv";

module.exports.description =
    "Verrouiller ou déverrouiller le vocal.";