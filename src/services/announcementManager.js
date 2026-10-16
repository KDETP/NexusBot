const sessions = new Map();

function sessionKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function createSession(guildId, userId, initialData = {}) {
    const key = sessionKey(guildId, userId);
    const draft = {
        guildId,
        userId,
        channelId: null,
        roleId: null,
        title: "Nouvelle annonce",
        description: "",
        content: "",
        image: "",
        link: "",
        createdAt: Date.now(),
        ...initialData
    };

    sessions.set(key, draft);
    return draft;
}

function getSession(guildId, userId) {
    const draft = sessions.get(sessionKey(guildId, userId));
    if (!draft) return null;

    // Expire automatiquement les brouillons apres 30 minutes.
    if (Date.now() - draft.createdAt > 30 * 60 * 1000) {
        sessions.delete(sessionKey(guildId, userId));
        return null;
    }

    return draft;
}

function deleteSession(guildId, userId) {
    return sessions.delete(sessionKey(guildId, userId));
}

module.exports = {
    createSession,
    getSession,
    deleteSession,
    sessionKey
};