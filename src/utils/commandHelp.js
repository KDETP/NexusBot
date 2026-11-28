const { EmbedBuilder } = require("discord.js");

const PAGE_LIMIT = 3_500;

// These commands manage server configuration or members and stay out of public help.
const STAFF_ONLY_COMMANDS = new Set([
    "7", "addc", "annonce", "backup", "ban", "chien", "clear",
    "giveaway", "kick", "membre", "panic", "protect", "purge", "rc",
    "reglement", "restore", "stats", "ticket", "to", "unban", "unto"
]);

// Public command descriptions, keyed by the names actually registered in commandHandler.
const COMMAND_HELP = {
    help: ["Aide", "Afficher les commandes publiques et leur description."],
    aide: ["Aide", "Afficher les commandes publiques et leur description."],
    z: ["Aide", "Recevoir cette liste de commandes publiques en message privé."],
    ping: ["Serveur", "Afficher la latence du bot."],
    comment: ["Serveur", "Afficher le guide du NebuCasino."],
    pv: ["Serveur", "Verrouiller ou déverrouiller ton salon vocal privé."],
    lafleche: ["Jeux", "Ouvrir le jeu La Flèche."],
    bingo: ["Jeux et économie", "Jouer au bingo et tenter de gagner des NebuCoins."],
    bj: ["Jeux et économie", "Jouer au blackjack."],
    casino: ["Jeux et économie", "Ouvrir le menu des jeux du casino."],
    casinohelp: ["Jeux et économie", "Consulter les règles des jeux du casino."],
    daily: ["Jeux et économie", "Récupérer ta récompense quotidienne."],
    endbj: ["Jeux et économie", "Arrêter ta partie de blackjack en cours."],
    gift: ["Jeux et économie", "Ouvrir un cadeau et choisir une récompense."],
    give: ["Jeux et économie", "Transférer des NebuCoins à un autre membre."],
    bal: ["Jeux et économie", "Afficher ton solde de NebuCoins."],
    profile: ["Jeux et économie", "Afficher ton profil, ton niveau et tes statistiques."],
    quiz: ["Jeux et économie", "Répondre à une question de quiz."],
    quizcasi: ["Jeux et économie", "Jouer au quiz casino quotidien pour gagner des NebuCoins."],
    roulette: ["Jeux et économie", "Parier à la roulette avec des NebuCoins."],
    slots: ["Jeux et économie", "Jouer aux machines à sous."],
    top: ["Jeux et économie", "Afficher le classement des joueurs les plus riches."],
    vol: ["Jeux et économie", "Tenter de voler des NebuCoins à un membre."],
    banner: ["Images et profils", "Afficher la bannière globale ou celle du serveur d'un membre."],
    blur: ["Images et profils", "Créer une image floue à partir de l'avatar d'un membre."],
    cat: ["Images et profils", "Afficher une image de chat aléatoire."],
    explode: ["Images et profils", "Créer une image explosion avec l'avatar d'un membre."],
    facepalm: ["Images et profils", "Créer une image facepalm avec un membre."],
    implode: ["Images et profils", "Créer une image implosion avec l'avatar d'un membre."],
    imagehelp: ["Images et profils", "Afficher l'aide des commandes d'images."],
    pixel: ["Images et profils", "Pixeliser l'avatar d'un membre."],
    pp: ["Images et profils", "Afficher la photo de profil d'un membre."],
    ship: ["Images et profils", "Créer une image de compatibilité entre deux membres."],
    trash: ["Images et profils", "Créer une image poubelle avec l'avatar d'un membre."],
    triggered: ["Images et profils", "Créer une image triggered avec l'avatar d'un membre."],
    wanted: ["Images et profils", "Créer une affiche Wanted avec l'avatar d'un membre."],
    play: ["Musique", "Lire un titre ou un lien compatible dans ton salon vocal."],
    skip: ["Musique", "Passer au morceau suivant."],
    bite: ["Interactions", "Créer une image où tu mordilles un membre."],
    blowkiss: ["Interactions", "Envoyer un bisou en image à un membre."],
    bonk: ["Interactions", "Créer une image bonk avec un membre."],
    cry: ["Interactions", "Créer une image où tu pleures."],
    cuddle: ["Interactions", "Créer une image câlin avec un membre."],
    dance: ["Interactions", "Créer une image où tu danses."],
    feed: ["Interactions", "Créer une image où tu nourris un membre."],
    handhold: ["Interactions", "Créer une image où tu tiens la main d'un membre."],
    highfive: ["Interactions", "Créer une image high five avec un membre."],
    hug: ["Interactions", "Créer une image câlin avec un membre."],
    kiss: ["Interactions", "Créer une image bisou avec un membre."],
    love: ["Interactions", "Créer une image d'amour avec un membre."],
    pat: ["Interactions", "Créer une image où tu caresses la tête d'un membre."],
    poke: ["Interactions", "Créer une image où tu taquines un membre."],
    punch: ["Interactions", "Créer une image où tu donnes un coup de poing à un membre."],
    shake: ["Interactions", "Créer une image où tu secoues un membre."],
    slap: ["Interactions", "Créer une image gifle avec un membre."],
    smile: ["Interactions", "Créer une image sourire."],
    stare: ["Interactions", "Créer une image où tu fixes un membre."],
    tickle: ["Interactions", "Créer une image où tu chatouilles un membre."],
    wave: ["Interactions", "Créer une image où tu fais coucou à un membre."],
    wink: ["Interactions", "Créer une image clin d'œil avec un membre."],
    yawn: ["Interactions", "Créer une image où tu bailles."]
};

function createPublicHelpEmbeds(client) {
    const commands = [...client.commands.values()]
        .filter(command =>
            command &&
            command.name &&
            !command.staffOnly &&
            !STAFF_ONLY_COMMANDS.has(command.name)
        )
        .map(command => {
            const help = COMMAND_HELP[command.name];

            return {
                name: command.name,
                category: help?.[0] || "Autres",
                description: help?.[1] || command.description || "Description à compléter."
            };
        })
        .sort((a, b) =>
            a.category.localeCompare(b.category, "fr") ||
            a.name.localeCompare(b.name, "fr")
        );

    const pages = [];
    let page = "";
    let previousCategory = "";

    for (const command of commands) {
        let heading = command.category === previousCategory
            ? ""
            : (page ? "\n" : "") + "## " + command.category + "\n";
        const line = "• " + String.fromCharCode(96) + "n" + command.name +
            String.fromCharCode(96) + " — " + command.description + "\n";

        if (page && page.length + heading.length + line.length > PAGE_LIMIT) {
            pages.push(page);
            page = "";
            heading = "## " + command.category + "\n";
        } else if (!page && !heading) {
            heading = "## " + command.category + "\n";
        }

        page += heading + line;
        previousCategory = command.category;
    }

    if (page) pages.push(page);

    const footer = commands.length +
        " commandes publiques • Les commandes staff sont masquées.";

    return pages.map((description, index) =>
        new EmbedBuilder()
            .setColor("#8B5CF6")
            .setTitle(
                pages.length > 1
                    ? "🌌 Nébula • Commandes (" + (index + 1) + "/" + pages.length + ")"
                    : "🌌 Nébula • Commandes"
            )
            .setDescription(description)
            .setFooter({ text: footer })
    );
}

async function sendPublicCommandHelp(message, { directMessage = false } = {}) {
    const embeds = createPublicHelpEmbeds(message.client);

    if (!embeds.length) {
        return message.reply("Aucune commande publique n'est disponible.");
    }

    if (!directMessage) {
        return message.reply({ embeds });
    }

    try {
        await message.author.send({ embeds });
        return message.reply({
            content: "📩 Je t'ai envoyé l'aide des commandes publiques en message privé.",
            allowedMentions: { repliedUser: false }
        });
    } catch (error) {
        console.error("Impossible d'envoyer l'aide en message privé :", error);
        return message.reply(
            "❌ Je n'ai pas pu t'envoyer l'aide en message privé. Vérifie que tes MP sont ouverts pour le serveur."
        );
    }
}

module.exports = {
    createPublicHelpEmbeds,
    sendPublicCommandHelp
};

