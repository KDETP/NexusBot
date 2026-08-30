const fs = require("fs");
const path = require("path");


const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);



async function updateStats(guild) {


    if (!fs.existsSync(statsPath)) return;


    const stats = JSON.parse(
        fs.readFileSync(statsPath, "utf8")
    );



    await guild.members.fetch();



    const total = guild.memberCount;


    const members = guild.members.cache.filter(
        m => !m.user.bot
    ).size;


    const bots = guild.members.cache.filter(
        m => m.user.bot
    ).size;



    const totalChannel = guild.channels.cache.get(
        stats.total
    );

    const membersChannel = guild.channels.cache.get(
        stats.members
    );

    const botsChannel = guild.channels.cache.get(
        stats.bots
    );



    if (totalChannel) {

        await totalChannel.setName(
            `🌎 Total : ${total}`
        );

    }


    if (membersChannel) {

        await membersChannel.setName(
            `👥 Membres : ${members}`
        );

    }


    if (botsChannel) {

        await botsChannel.setName(
            `🤖 Bots : ${bots}`
        );

    }


}



module.exports = async (client) => {



    client.on(
        "guildMemberAdd",
        member => {

            updateStats(member.guild);

        }
    );



    client.on(
        "guildMemberRemove",
        member => {

            updateStats(member.guild);

        }
    );



    // Mise à jour au démarrage

    client.guilds.cache.forEach(
        guild => {

            updateStats(guild);

        }
    );


};