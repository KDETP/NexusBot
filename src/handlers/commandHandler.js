const fs = require("fs");
const path = require("path");

module.exports = (client) => {

    client.commands = new Map();

    const commandsPath =
        path.join(__dirname, "..", "commands");

    const commandFiles =
        fs
            .readdirSync(commandsPath)
            .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {

        const command =
            require(path.join(commandsPath, file));

        // ==========================================
        // FICHIER AVEC PLUSIEURS COMMANDES
        // ==========================================

        if (Array.isArray(command)) {

            for (const cmd of command) {

                if (!cmd.name || !cmd.execute) {
                    console.log(
                        `⚠️ Commande invalide dans ${file}`
                    );

                    continue;
                }

                client.commands.set(
                    cmd.name,
                    cmd
                );

                console.log(
                    `📦 Commande chargée : ${cmd.name}`
                );
            }

            continue;
        }

        // ==========================================
        // FICHIER NORMAL = UNE COMMANDE
        // ==========================================

        if (!command.name || !command.execute) {

            console.log(
                `⚠️ Commande invalide : ${file}`
            );

            continue;
        }

        client.commands.set(
            command.name,
            command
        );

        console.log(
            `📦 Commande chargée : ${command.name}`
        );
    }
};