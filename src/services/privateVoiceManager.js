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
// VOCALS ACTUELLEMENT PRIVÉS
// ==========================================

const privateVoiceChannels = new Set();


// Permet au voiceStateUpdate de savoir quels salons sont privés.
module.exports.privateVoiceChannels = privateVoiceChannels;


// ==========================================
// COMMANDE NPV
// ==========================================

module.exports.executePrivateVoice = async function (message) {

    // ======================================
    // PERMISSION
    // ======================================

    const allowed =
        message.member.roles.cache.some(
            role => PRIVATE_VOICE_ROLES.includes(role.id)
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


    // ======================================
    // MARQUER LE VOCAL COMME PRIVÉ
    // ======================================

    privateVoiceChannels.add(voiceChannel.id);


    return message.reply(
        "🔒 **Vocal privé !**\nLes membres non autorisés seront automatiquement déconnectés."
    );
};


// ==========================================
// EXPORT DE LA COMMANDE
// ==========================================

module.exports.name = "pv";

module.exports.description =
    "Rendre le vocal privé.";