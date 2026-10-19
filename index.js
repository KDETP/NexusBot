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

const {
    createMusicPlayer
} = require("./src/services/musicPlayer");


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

// Le lecteur est créé une seule fois et conserve une file distincte par serveur.
client.music = createMusicPlayer(client);


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
