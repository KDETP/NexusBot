const {
    executePrivateVoice
} = require("../services/privateVoiceManager");

module.exports = {

    name: "pv",

    description:
        "Verrouiller ou déverrouiller le vocal.",

    async execute(message) {

        return executePrivateVoice(
            message
        );

    }

};