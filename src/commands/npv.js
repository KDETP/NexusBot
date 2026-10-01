const {
    privateVoiceChannels,
    executePrivateVoice
} = require("../services/privateVoiceManager");

module.exports = {
    name: "pv",

    description:
        "Rendre le vocal privé.",

    async execute(message) {
        return executePrivateVoice(message);
    }
};