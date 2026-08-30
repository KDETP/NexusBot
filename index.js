require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const {
    LavalinkManager
} = require("lavalink-client");

const eventHandler =
    require("./src/handlers/eventHandler");

const commandHandler =
    require("./src/handlers/commandHandler");

const activityEngine =
    require("./src/services/activityEngine");

const brain =
    require("./src/services/brain");

const musicPlayer =
    require("./src/services/musicPlayer");


// ==========================================
// FFMPEG
// ==========================================

if (process.platform === "win32") {

    process.env.FFMPEG_PATH =
        "C:\\Users\\ausxj\\Desktop\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe";

} else {

    process.env.FFMPEG_PATH =
        "/usr/bin/ffmpeg";

}


// ==========================================
// BASE DE DONNÉES
// ==========================================

require("./src/database/database");
require("./src/database/tables");


// ==========================================
// CLIENT DISCORD
// ==========================================

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessageReactions,

        GatewayIntentBits.GuildVoiceStates

    ],

    partials: [

        Partials.Message,

        Partials.Channel,

        Partials.Reaction

    ]

});


// ==========================================
// LAVALINK
// ==========================================

client.lavalink = new LavalinkManager({

    nodes: [

        {

            id: "NexusLavalink",

            host: "127.0.0.1",

            port: 2333,

            authorization: "NexusLavalink2026",

            secure: false,

            retryAmount: 10,

            retryDelay: 5000

        }

    ],

    sendToShard: (guildId, payload) => {

        const guild =
            client.guilds.cache.get(guildId);

        if (!guild) {
            return;
        }

        guild.shard.send(payload);

    },

    autoSkip: true,

    client: {

        id: process.env.CLIENT_ID,

        username: "NebuMusic"

    }

});


// ==========================================
// DISCORD → LAVALINK
// ==========================================

client.on(
    "raw",
    data => {

        client.lavalink.sendRawData(data);

    }
);


// ==========================================
// ÉVÉNEMENTS NODE LAVALINK
// ==========================================

client.lavalink.nodeManager.on(
    "connect",
    node => {

        console.log(
            `🟢 Lavalink connecté : ${node.id}`
        );

    }
);


client.lavalink.nodeManager.on(
    "disconnect",
    (node, reason) => {

        console.warn(
            `🟠 Lavalink déconnecté : ${node.id}`
        );

        console.warn(
            reason
        );

    }
);


client.lavalink.nodeManager.on(
    "reconnecting",
    node => {

        console.warn(
            `🔄 Reconnexion Lavalink : ${node.id}`
        );

    }
);


client.lavalink.nodeManager.on(
    "error",
    (node, error) => {

        console.error(
            `❌ Erreur Lavalink (${node.id}) :`
        );

        console.error(
            error
        );

    }
);


// ==========================================
// HANDLERS
// ==========================================

commandHandler(client);

eventHandler(client);


// ==========================================
// BOT PRÊT
// ==========================================

client.once(
    "clientReady",
    async () => {

        console.log(
            `✅ ${client.user.tag} est connecté !`
        );


        // ======================================
        // INITIALISATION LAVALINK
        // ======================================

        try {

            client.lavalink.init({

                ...client.user

            });

            console.log(
                "🎵 Lavalink initialisé !"
            );

        } catch (error) {

            console.error(
                "❌ Impossible d'initialiser Lavalink :"
            );

            console.error(
                error
            );

        }


        // ======================================
        // ÉVÉNEMENTS DU MUSIC PLAYER
        // ======================================

        try {

            if (
                typeof musicPlayer.setupLavalinkEvents ===
                "function"
            ) {

                musicPlayer.setupLavalinkEvents(
                    client.lavalink
                );

                console.log(
                    "🎵 Événements NebuMusic connectés à Lavalink !"
                );

            } else {

                console.warn(
                    "⚠️ setupLavalinkEvents absent de musicPlayer.js"
                );

            }

        } catch (error) {

            console.error(
                "❌ Erreur initialisation NebuMusic :"
            );

            console.error(
                error
            );

        }


        console.log(
            "🎵 NebuMusic chargé !"
        );


        // ======================================
        // SERVICES
        // ======================================

        activityEngine.start(
            client
        );


        brain.start(
            client
        );

    }
);


// ==========================================
// CONNEXION
// ==========================================

client.login(
    process.env.TOKEN
);