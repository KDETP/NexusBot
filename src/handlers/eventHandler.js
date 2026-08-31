const fs = require("fs");
const path = require("path");

module.exports = (client) => {

    const eventsPath =
        path.join(__dirname, "..", "events");


    const eventFiles =
        fs.readdirSync(eventsPath)
            .filter(file => file.endsWith(".js"));


    // Ces fichiers sont gérés par interactionCreate.js
    const ignoredEvents = [

        "ticketButtons.js",
        "ticketRequest.js",
        "ticketClose.js"

    ];


    for (const file of eventFiles) {


        if (ignoredEvents.includes(file)) {

            console.log(
                `⏭️ Evénement ignoré : ${file} (géré par interactionCreate)`
            );

            continue;

        }


        const event =
            require(
                path.join(eventsPath, file)
            );


        switch (file) {


            // ======================================
            // READY
            // ======================================

            case "ready.js":

                client.once(
                    "clientReady",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // SERVER STATS
            // ======================================

            case "serverStats.js":

                event(client);

            break;


            // ======================================
            // INTERACTIONS
            // ======================================

            case "interactionCreate.js":

            case "casinoMenu.js":

            case "casinoButtons.js":

            case "casinoHelpMenu.js":

                client.on(
                    "interactionCreate",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // MESSAGES
            // ======================================

            case "messageCreate.js":

                client.on(
                    "messageCreate",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // RÉACTIONS
            // ======================================

            case "messageReactionAdd.js":

                client.on(
                    "messageReactionAdd",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // VOCAL
            // ======================================

            case "voiceStateUpdate.js":

                client.on(
                    "voiceStateUpdate",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // ARRIVÉE MEMBRE
            // ======================================

            case "guildMemberAdd.js":

                client.on(
                    "guildMemberAdd",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // MISE À JOUR MEMBRE
            // ======================================

            case "guildMemberUpdate.js":

                client.on(
                    "guildMemberUpdate",
                    (...args) =>
                        event(client, ...args)
                );

            break;


            // ======================================
            // DÉPART MEMBRE
            // ======================================

            case "guildMemberRemove.js":

                client.on(
                    "guildMemberRemove",
                    (...args) =>
                        event(client, ...args)
                );

            break;


        }


        console.log(
            `📥 Evénement chargé : ${file}`
        );


    }

};