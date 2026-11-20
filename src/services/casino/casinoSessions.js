const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function expire(messageId) {
    const session = sessions.get(messageId);
    if (!session) return;

    clearTimeout(session.timer);
    session.timer = setTimeout(() => sessions.delete(messageId), SESSION_TTL);
    session.timer.unref?.();
}

module.exports = {

    create(messageId, userId) {
        const previous = sessions.get(messageId);
        if (previous) clearTimeout(previous.timer);

        sessions.set(messageId, {
            userId,
            timer: null
        });
        expire(messageId);
    },

    get(messageId) {
        const session = sessions.get(messageId);
        if (!session) return undefined;

        expire(messageId);
        return session.userId;
    },

    delete(messageId) {
        const session = sessions.get(messageId);
        if (session) clearTimeout(session.timer);
        sessions.delete(messageId);
    }

};
