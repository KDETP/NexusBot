require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const eventHandler =
    require("./src/handlers/eventHandler");

const commandHandler =
    require("./src/handlers/commandHandler");

const activityEngine =
    require("./src/services/activityEngine");

const brain =
    require("./src/services/brain");


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


        console.log(
            "🎵 NebuMusic chargé !"
        );


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