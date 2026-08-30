const sessions = new Map();

module.exports = {

    create(messageId, userId) {
        sessions.set(messageId, userId);
    },

    get(messageId) {
        return sessions.get(messageId);
    },

    delete(messageId) {
        sessions.delete(messageId);
    }

};