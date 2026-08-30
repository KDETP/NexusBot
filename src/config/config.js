module.exports = {
    botName: "Nébul'App",

    activity: {
        enabled: true,
        channelName: "général", // Le salon principal où le bot créera de l'activité
        minMessages: 15,
        minMembersOnline: 3,
        cooldown: 20 * 60 * 1000 // 20 minutes
    },

    economy: {
        enabled: true,
        startingMoney: 500
    },

    casino: {
        enabled: true
    }
};