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
// VOCALS PRIVÉS
// ==========================================

const privateVoiceChannels =
    require("../services/privateVoiceManager").privateVoiceChannels;


// ==========================================
// MESSAGES ALÉATOIRES
// ==========================================

const PRIVATE_VOICE_MESSAGES = [
    "💀 Gros, la voc est privée là !!!",
    "🚫 Frérot, cette voc est privée.",
    "😭 Tu t'es trompé de voc, celle-là elle est privée.",
    "🔒 Gros la voc est privée là, tu peux pas rentrer.",
    "💀 La porte est fermée frérot.",
    "🚪 Désolé gros, accès refusé, la voc est privée.",
    "😭 Même pas tu rentres ici, c'est privé.",
    "🔒 Cette voc c'est staff uniquement gros.",
    "💀 T'as essayé de rentrer dans une voc privée toi.",
    "🚫 Nope frérot, cette voc est privée.",
    "😭 Gros, regarde un peu, c'est PRIVÉ ici.",
    "🔒 Accès refusé mon reuf, la voc est privée."
];


function randomPrivateMessage() {
    return PRIVATE_VOICE_MESSAGES[
        Math.floor(
            Math.random() * PRIVATE_VOICE_MESSAGES.length
        )
    ];
}


// ==========================================
// ÉVÉNEMENT
// ==========================================

module.exports = async (
    client,
    oldState,
    newState
) => {

    // Seulement lorsqu'une personne rejoint un vocal
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


    // Ignorer les bots
    if (member.user.bot) {
        return;
    }


    // ======================================
    // VÉRIFIER SI LE VOCAL EST PRIVÉ
    // ======================================

    if (
        !privateVoiceChannels.has(
            channel.id
        )
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


    if (allowed) {
        return;
    }


    // ======================================
    // DÉCONNECTER
    // ======================================

    try {

        await member.voice.disconnect(
            "Tentative de rejoindre un vocal privé"
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
            content: randomPrivateMessage()
        });

    } catch (error) {

        console.log(
            `⚠️ Impossible d'envoyer un MP à ${member.user.tag}.`
        );

    }

};