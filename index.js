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

const {
    createServerLogger
} = require("./src/services/serverLogger");

const {
    createDMSupport
} = require("./src/events/dmSupport");


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

        GatewayIntentBits.DirectMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessageReactions,

        GatewayIntentBits.GuildVoiceStates,

        GatewayIntentBits.GuildModeration,

        GatewayIntentBits.GuildExpressions,

        GatewayIntentBits.GuildInvites,

        GatewayIntentBits.AutoModerationExecution,

        GatewayIntentBits.AutoModerationConfiguration,

        GatewayIntentBits.GuildScheduledEvents

    ],

    partials: [

        Partials.Message,

        Partials.Channel,

        Partials.Reaction

    ]

});

// Le lecteur est créé une seule fois et conserve une file distincte par serveur.
client.music = createMusicPlayer(client);

// Ajoute les logs sans remplacer les handlers existants.
createServerLogger(client);

// Active la réception et la gestion des messages privés.
createDMSupport(client);


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
