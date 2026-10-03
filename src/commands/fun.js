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

            `❌ Mentionne quelqu'un pour utiliser n${actionName}.`

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

            `❌ Tu ne peux pas faire n${actionName} sur toi-même. 😭`

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

// ======================================================
// COMMANDE LOVE
// ======================================================

async function executeLove(message, args = []) {

    let target = message.mentions.users.first();
    const rawId = args[0];

    if (!target && rawId && /^\d{17,20}$/.test(rawId)) {
        try {
            target = await message.client.users.fetch(rawId);
        } catch {
            target = null;
        }
    }

    // Fallback si le handler ne transmet pas args.
    if (!target && message.content) {
        const parts = message.content.trim().split(/\s+/);
        const contentId = parts[1];

        if (contentId && /^\d{17,20}$/.test(contentId)) {
            try {
                target = await message.client.users.fetch(contentId);
            } catch {
                target = null;
            }
        }
    }

    if (!target) {
        return message.reply(
            "❌ Utilisation : `nlove @user` ou `nlove ID_du_user`"
        );
    }

    if (target.id === message.author.id) {
        return message.reply("❤️ Tu t'aimes toi-même à ce point ? 😭");
    }

    if (target.bot) {
        return message.reply(
            `❌ **${target.username}** est un bot. L'amour avec une IA ça compte pas. 🤖`
        );
    }

    const percent = calculateLove(message.author.id, target.id);

    let title;
    let loveText;
    let category;
    let color;

    if (percent <= 14) {
        title = "💀 Catastrophe sentimentale";
        loveText = [
            "Même les étoiles vous regardent et disent non.",
            "Il n'y a absolument RIEN entre vous deux. 😭",
            "Cupidon a vu le résultat et a rangé son arc.",
            "Votre histoire d'amour est morte avant même de commencer.",
            "Même une amitié serait déjà ambitieuse."
        ][Math.floor(Math.random() * 5)];
        category = "cry";
        color = "#2F3136";
    } else if (percent <= 29) {
        title = "💔 Presque rien";
        loveText = [
            "Il y a plus de sentiments dans une pierre.",
            "Cupidon a essayé... puis il a abandonné.",
            "Ça ressemble davantage à une erreur de calcul.",
            "Vous deux ? Même pas dans un univers parallèle.",
            "La compatibilité est actuellement en congé."
        ][Math.floor(Math.random() * 5)];
        category = "cry";
        color = "#6B7280";
    } else if (percent <= 44) {
        title = "🥲 C'est compliqué";
        loveText = [
            "Il y a peut-être quelque chose... mais faut vraiment chercher.",
            "Une petite étincelle existe. Très petite.",
            "Ça pourrait marcher, mais faut pas trop rêver.",
            "Vous avez quelques points communs sentimentaux.",
            "Cupidon hésite encore."
        ][Math.floor(Math.random() * 5)];
        category = "stare";
        color = "#F59E0B";
    } else if (percent <= 59) {
        title = "💛 Il y a quelque chose";
        loveText = [
            "Il y a clairement une petite alchimie.",
            "Ça pourrait devenir intéressant.",
            "Vous n'êtes pas encore un couple, mais qui sait...",
            "Cupidon commence doucement à s'intéresser à vous.",
            "Une histoire pourrait commencer ici."
        ][Math.floor(Math.random() * 5)];
        category = "stare";
        color = "#FBBF24";
    } else if (percent <= 74) {
        title = "💕 Belle alchimie";
        loveText = [
            "Vous avez clairement quelque chose.",
            "Les étoiles commencent à s'aligner.",
            "Il y a une vraie connexion entre vous.",
            "Cette histoire pourrait réellement fonctionner.",
            "Cupidon commence à sourire."
        ][Math.floor(Math.random() * 5)];
        category = "hug";
        color = "#EC4899";
    } else if (percent <= 89) {
        title = "💞 Très belle compatibilité";
        loveText = [
            "Vous êtes clairement faits pour vous entendre.",
            "Il y a énormément d'alchimie entre vous.",
            "Cupidon commence sérieusement à travailler.",
            "Cette relation pourrait devenir très belle.",
            "Vous deux ensemble ? Ça donne quelque chose."
        ][Math.floor(Math.random() * 5)];
        category = "kiss";
        color = "#F472B6";
    } else if (percent <= 99) {
        title = "💋 Amour presque parfait";
        loveText = [
            "Il manque seulement un tout petit quelque chose.",
            "Vous êtes à deux doigts de devenir inséparables.",
            "Cupidon a clairement visé juste.",
            "Cette compatibilité est presque indécente.",
            "Vous deux ? Ça ressemble dangereusement à de l'amour."
        ][Math.floor(Math.random() * 5)];
        category = "kiss";
        color = "#DB2777";
    } else {
        title = "💍 ÂMES SŒURS";
        loveText = [
            "Le destin vous a littéralement réunis.",
            "100 %. Plus haut c'est impossible.",
            "Cupidon peut prendre sa retraite.",
            "Vous êtes officiellement l'un pour l'autre.",
            "Même l'univers valide votre relation."
        ][Math.floor(Math.random() * 5)];
        category = "kiss";
        color = "#F43F5E";
    }

    let gifUrl = null;

    try {
        const gif = await getGif(category);
        gifUrl = gif?.url || null;
    } catch (error) {
        console.error("❌ Erreur GIF love :", error.message);
    }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`💗 ${message.author.username} × ${target.username}`)
        .setDescription([
            `## ${title}`,
            "",
            "### ❤️ Compatibilité amoureuse",
            "",
            `# **${percent}%**`,
            "",
            loveBar(percent),
            "",
            `> ${loveText}`,
            "",
            percent >= 90
                ? "💍 **Le destin a parlé.**"
                : percent >= 70
                    ? "💞 **Ça devient sérieux...**"
                    : percent >= 40
                        ? "👀 **À surveiller...**"
                        : "💀 **On va éviter le mariage pour l'instant.**"
        ].join("\n"))
        .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: "💞 Calcul personnalisé pour ces deux utilisateurs" })
        .setTimestamp();

    if (gifUrl) {
        embed.setImage(gifUrl);
    }

    return message.reply({ embeds: [embed] });
}

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



    async execute(message, args) {

            return executeLove(
                message,
                args
            );
        }



});



// ======================================================

// EXPORT

// ======================================================



module.exports = commands;