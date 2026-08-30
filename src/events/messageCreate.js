const activityEngine = require("../services/activityEngine");
const brain = require("../services/brain");
const antiSpam = require("../services/antiSpam");
const levelSystem = require("../services/levelSystem");

module.exports = async (client, message) => {

    console.log("📩 Message reçu :", message.content);

    if (message.author.bot) return;

    activityEngine.addMessage();
    brain.addMessage();

    // Ajout de l'XP
    await levelSystem.addXP(message);

    // Vérification Anti-Spam
    await antiSpam.check(message);

    const content = message.content.toLowerCase();

let prefix;

if (content.startsWith("nebu")) {

    prefix = "nebu";

} else if (content.startsWith("n")) {

    prefix = "n";

} else {

    return;

}


const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/);

    const commandName = args.shift()?.toLowerCase();

    console.log("📌 Commande détectée :", commandName);

    const command = client.commands.get(commandName);

    if (!command) {
        console.log("❌ Commande introuvable :", commandName);
        return;
    }

    console.log("✅ Commande trouvée :", command.name);

    try {

        await command.execute(message, args);

        console.log("✅ Commande exécutée avec succès.");

    } catch (err) {

        console.error("💥 Erreur lors de l'exécution de la commande :");
        console.error(err);

        message.reply("❌ Une erreur est survenue.");

    }

};