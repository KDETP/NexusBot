const fs = require("fs");
const path = require("path");

const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);


// =========================================================
// MISE A JOUR DES STATS
// =========================================================

async function updateStats(guild) {

    try {

        if (!fs.existsSync(statsPath)) {

            console.log(
                "❌ serverStats.json introuvable."
            );

            return;
        }


        const stats = JSON.parse(
            fs.readFileSync(
                statsPath,
                "utf8"
            )
        );


        // =====================================================
        // IMPORTANT
        // =====================================================
        // On NE fait plus :
        //
        // await guild.members.fetch();
        //
        // Cela évite les GatewayRateLimitError.
        // =====================================================


        const total =
            guild.memberCount;


        // Membres actuellement présents dans le cache
        const members =
            guild.members.cache.filter(
                member =>
                    !member.user.bot
            ).size;


        // Bots actuellement présents dans le cache
        const bots =
            guild.members.cache.filter(
                member =>
                    member.user.bot
            ).size;


        // =====================================================
        // CHANNELS
        // =====================================================

        const totalChannel =
            guild.channels.cache.get(
                stats.total
            );


        const membersChannel =
            guild.channels.cache.get(
                stats.members
            );


        const botsChannel =
            guild.channels.cache.get(
                stats.bots
            );


        // =====================================================
        // TOTAL
        // =====================================================

        if (totalChannel) {

            const name =
                `🌎 Total : ${total}`;


            if (
                totalChannel.name !== name
            ) {

                await totalChannel.setName(
                    name
                );
            }
        }


        // =====================================================
        // MEMBRES
        // =====================================================

        if (membersChannel) {

            const name =
                `👥 Membres : ${members}`;


            if (
                membersChannel.name !== name
            ) {

                await membersChannel.setName(
                    name
                );
            }
        }


        // =====================================================
        // BOTS
        // =====================================================

        if (botsChannel) {

            const name =
                `🤖 Bots : ${bots}`;


            if (
                botsChannel.name !== name
            ) {

                await botsChannel.setName(
                    name
                );
            }
        }


        console.log(
            `📊 Stats mises à jour : ${total} total | ${members} membres | ${bots} bots`
        );


    } catch (error) {

        console.error(
            "❌ Erreur lors de la mise à jour des stats :",
            error
        );

    }

}


// =========================================================
// EVENT
// =========================================================

module.exports = async (client) => {


    // =====================================================
    // BOT PRET
    // =====================================================

    client.once(
        "clientReady",
        async () => {

            console.log(
                "📊 Synchronisation des statistiques..."
            );


            for (
                const guild
                of client.guilds.cache.values()
            ) {

                await updateStats(
                    guild
                );

            }


            console.log(
                "✅ Statistiques synchronisées."
            );

        }
    );


    // =====================================================
    // NOUVEAU MEMBRE
    // =====================================================

    client.on(
        "guildMemberAdd",
        async (member) => {

            await updateStats(
                member.guild
            );

        }
    );


    // =====================================================
    // MEMBRE QUI PART
    // =====================================================

    client.on(
        "guildMemberRemove",
        async (member) => {

            await updateStats(
                member.guild
            );

        }
    );

};