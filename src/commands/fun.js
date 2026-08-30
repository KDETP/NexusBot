const {
    EmbedBuilder
} = require("discord.js");

// ======================================================
// CONFIGURATION
// ======================================================

const API_BASE =
    "https://nekos.best/api/v2";

const USER_AGENT =
    "NebuBot (NexusBot Discord)";

// ======================================================
// CONFIGURATION DES INTERACTIONS
// ======================================================

const ACTIONS = {

    hug: {
        category: "hug",
        emoji: "🤗",
        text: (author, target) =>
            `**${author}** fait un gros câlin à **${target}** !`
    },

    kiss: {
        category: "kiss",
        emoji: "💋",
        text: (author, target) =>
            `**${author}** embrasse **${target}** !`
    },

    slap: {
        category: "slap",
        emoji: "👋",
        text: (author, target) =>
            `**${author}** met une énorme claque à **${target}** !`
    },

    cuddle: {
        category: "cuddle",
        emoji: "🫂",
        text: (author, target) =>
            `**${author}** se blottit contre **${target}** !`
    },

    pat: {
        category: "pat",
        emoji: "🥰",
        text: (author, target) =>
            `**${author}** caresse la tête de **${target}** !`
    },

    bonk: {
        category: "bonk",
        emoji: "🔨",
        text: (author, target) =>
            `**${author}** vient de bonk **${target}** !`
    },

    bite: {
        category: "bite",
        emoji: "🦷",
        text: (author, target) =>
            `**${author}** mord **${target}** !`
    },

    blowkiss: {
        category: "blowkiss",
        emoji: "😘",
        text: (author, target) =>
            `**${author}** envoie un bisou à **${target}** !`
    },

    dance: {
        category: "dance",
        emoji: "💃",
        text: (author, target) =>
            `**${author}** danse avec **${target}** !`
    },

    highfive: {
        category: "highfive",
        emoji: "🙌",
        text: (author, target) =>
            `**${author}** fait un high five à **${target}** !`
    },

    handhold: {
        category: "handhold",
        emoji: "🤝",
        text: (author, target) =>
            `**${author}** prend la main de **${target}** !`
    },

    poke: {
        category: "poke",
        emoji: "👉",
        text: (author, target) =>
            `**${author}** poke **${target}** !`
    },

    punch: {
        category: "punch",
        emoji: "👊",
        text: (author, target) =>
            `**${author}** frappe **${target}** !`
    },

    kick: {
        category: "kick",
        emoji: "🦵",
        text: (author, target) =>
            `**${author}** donne un coup de pied à **${target}** !`
    },

    wave: {
        category: "wave",
        emoji: "👋",
        text: (author, target) =>
            `**${author}** fait coucou à **${target}** !`
    },

    wink: {
        category: "wink",
        emoji: "😉",
        text: (author, target) =>
            `**${author}** fait un clin d'œil à **${target}** !`
    },

    smile: {
        category: "smile",
        emoji: "😊",
        text: (author, target) =>
            `**${author}** sourit à **${target}** !`
    },

    cry: {
        category: "cry",
        emoji: "😭",
        text: (author, target) =>
            `**${author}** pleure avec **${target}** !`
    },

    feed: {
        category: "feed",
        emoji: "🍜",
        text: (author, target) =>
            `**${author}** donne à manger à **${target}** !`
    },

    tickle: {
        category: "tickle",
        emoji: "😂",
        text: (author, target) =>
            `**${author}** chatouille **${target}** !`
    },

    shake: {
        category: "shake",
        emoji: "🤝",
        text: (author, target) =>
            `**${author}** secoue **${target}** !`
    },

    stare: {
        category: "stare",
        emoji: "👀",
        text: (author, target) =>
            `**${author}** fixe **${target}** !`
    },

    yawn: {
        category: "yawn",
        emoji: "🥱",
        text: (author, target) =>
            `**${author}** baille avec **${target}** !`
    }
};

// ======================================================
// RECUPERATION D'UN GIF
// ======================================================

async function getGif(category) {

    const response =
        await fetch(
            `${API_BASE}/${category}`,
            {
                headers: {
                    "User-Agent": USER_AGENT
                }
            }
        );

    if (!response.ok) {
        throw new Error(
            `Nekos.Best HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    if (
        !data.results ||
        !data.results.length ||
        !data.results[0].url
    ) {
        throw new Error(
            "Aucun GIF retourné par Nekos.Best."
        );
    }

    return data.results[0];
}

// ======================================================
// CALCUL AMOUR
// ======================================================

function calculateLove(id1, id2) {

    // On trie les IDs pour que
    // A + B = B + A

    const ids = [
        String(id1),
        String(id2)
    ].sort();

    const input =
        `${ids[0]}:${ids[1]}`;

    // Hash déterministe
    let hash = 0;

    for (let i = 0; i < input.length; i++) {

        hash =
            ((hash << 5) -
                hash) +
            input.charCodeAt(i);

        hash |= 0;
    }

    hash =
        Math.abs(hash);

    return hash % 101;
}

// ======================================================
// BARRE D'AMOUR
// ======================================================

function loveBar(percent) {

    const total = 10;

    const filled =
        Math.round(
            (percent / 100) * total
        );

    return (
        "❤️".repeat(filled) +
        "🖤".repeat(total - filled)
    );
}

// ======================================================
// TEXTE AMOUR
// ======================================================

function loveMessage(percent) {

    if (percent >= 95) {
        return "💍 Âmes sœurs. Le mariage est proche.";
    }

    if (percent >= 85) {
        return "💞 Vous êtes clairement faits l'un pour l'autre.";
    }

    if (percent >= 70) {
        return "💕 Ça sent très bon cette histoire.";
    }

    if (percent >= 55) {
        return "💗 Il y a clairement quelque chose.";
    }

    if (percent >= 40) {
        return "💛 Ça peut marcher... peut-être.";
    }

    if (percent >= 20) {
        return "💔 C'est compliqué.";
    }

    return "💀 Fuyez tant qu'il est encore temps.";
}

// ======================================================
// COMMANDE D'INTERACTION
// ======================================================

async function executeInteraction(
    message,
    actionName,
    action
) {

    // ==========================================
    // UTILISATEUR CIBLE
    // ==========================================

    const target =
        message.mentions.users.first();

    if (!target) {

        return message.reply(
            `❌ Mentionne quelqu'un pour utiliser \`n${actionName}\`.`
        );
    }

    // ==========================================
    // SOI-MEME
    // ==========================================

    if (
        target.id ===
        message.author.id
    ) {

        return message.reply(
            `❌ Tu ne peux pas faire \`n${actionName}\` sur toi-même. 😭`
        );
    }

    // ==========================================
    // BOT
    // ==========================================

    if (target.bot) {

        return message.reply(
            `❌ **${target.username}** est un bot.`
        );
    }

    try {

        console.log(
            `🎭 Interaction : ${actionName} → ${target.username}`
        );

        // ==========================================
        // RECUPERE LE GIF
        // ==========================================

        const gif =
            await getGif(
                action.category
            );

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor("#8B5CF6")

                .setDescription(
                    `${action.emoji} ${action.text(
                        message.author.username,
                        target.username
                    )}`
                )

                .setImage(
                    gif.url
                );

        await message.reply({
            embeds: [
                embed
            ]
        });

    } catch (error) {

        console.error(
            `❌ Erreur ${actionName} :`,
            error
        );

        return message.reply(
            "❌ Impossible de récupérer un GIF pour le moment."
        );
    }
}

// ======================================================
// COMMANDE LOVE
// ======================================================

async function executeLove(message) {

    const target =
        message.mentions.users.first();

    if (!target) {

        return message.reply(
            "❌ Mentionne quelqu'un. Exemple : `nlove @user`"
        );
    }

    if (
        target.id ===
        message.author.id
    ) {

        return message.reply(
            "❤️ Tu t'aimes toi-même à ce point ? 😭"
        );
    }

    if (target.bot) {

        return message.reply(
            "❌ L'amour avec un bot, ça ne compte pas. 🤖"
        );
    }

    const percent =
        calculateLove(
            message.author.id,
            target.id
        );

    const embed =
        new EmbedBuilder()

            .setColor("#EC4899")

            .setTitle(
                `💗 ${message.author.username} × ${target.username}`
            )

            .setDescription(
                [
                    `### ❤️ Compatibilité amoureuse`,
                    "",
                    `**${percent}%**`,
                    "",
                    loveBar(percent),
                    "",
                    `> ${loveMessage(percent)}`
                ].join("\n")
            )

            .setFooter({
                text:
                    "💞 Calcul personnalisé pour ces deux utilisateurs"
            });

    return message.reply({
        embeds: [
            embed
        ]
    });
}

// ======================================================
// GENERATION DES COMMANDES
// ======================================================

const commands = [];

// Toutes les interactions
for (
    const [name, action]
    of Object.entries(ACTIONS)
) {

    commands.push({

        name,

        async execute(message) {

            return executeInteraction(
                message,
                name,
                action
            );
        }

    });
}

// Love
commands.push({

    name: "love",

    async execute(message) {

        return executeLove(
            message
        );
    }

});

// ======================================================
// EXPORT
// ======================================================

module.exports = commands;