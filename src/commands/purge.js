module.exports = {

    name: "purge",

    async execute(message, args) {

        const clearCommand = require("./clear");

        return clearCommand.execute(message, args);

    }

};