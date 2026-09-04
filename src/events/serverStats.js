const fs = require("fs");
const path = require("path");

const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);


// =========================================================
// CACHE DES COMPTEURS PAR SERVEUR
// =========================================================

const guildStatsCache = new Map();


// =========================================================
// LECTURE DU FICHIER
// =========================================================

function loadConfig() {

    if (!fs.existsSync(statsPath)) {

        console.log(
            "❌ serverStats.json introuvable."
        );

        return null;
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                statsPath,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ Impossible de lire serverStats.json :",
            error
        );

        return null;
    }
}


// =========================================================
// CREER / ACTUALISER LE CACHE D'UN SERVEUR
// =========================================================

async function initializeGuildStats(guild) {

    try {

        /*
         * IMPORTANT :
         * On fait UN SEUL fetch complet au démarrage.
         * Ensuite les événements guildMemberAdd / Remove
         * mettent simplement les compteurs à jour.
         */

        await guild.members.fetch();

        const members =
            guild.members.cache.filter(
                member => !member.user.bot
            ).size;

        const bots =
            guild.members.cache.filter(
                member => member.user.bot
            ).size;


        guildStatsCache.set(
            guild.id,
            {
                members,
                bots
            }
        );


        console.log(
            `📊 Cache membres initialisé : ${guild.name} → ${members} membres | ${bots} bots`
        );


        await updateChannels(
            guild
        );

    } catch (error) {

        console.error(
            `❌ Erreur initialisation stats ${guild.name} :`,
            error
        );

    }
}


// =========================================================
// METTRE A JOUR LES CHANNELS
// =========================================================

async function updateChannels(guild) {

    try {

        const stats =
            loadConfig();

        if (!stats) {
            return;
        }


        const cached =
            guildStatsCache.get(
                guild.id
            );


        if (!cached) {
            return;
        }


        const total =
            guild.memberCount;

        const members =
            cached.members;

        const bots =
            cached.bots;


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
            "❌ Erreur mise à jour des channels :",
            error
        );

    }
}


// =========================================================
// MEMBRE QUI REJOINT
// =========================================================

async function handleMemberAdd(member) {

    const guild =
        member.guild;


    let cached =
        guildStatsCache.get(
            guild.id
        );


    if (!cached) {

        // Si le cache n'existe pas encore,
        // on l'initialise une seule fois.
        await initializeGuildStats(
            guild
        );

        return;
    }


    if (
        member.user.bot
    ) {

        cached.bots++;

    } else {

        cached.members++;

    }


    guildStatsCache.set(
        guild.id,
        cached
    );


    await updateChannels(
        guild
    );
}


// =========================================================
// MEMBRE QUI PART
// =========================================================

async function handleMemberRemove(member) {

    const guild =
        member.guild;


    let cached =
        guildStatsCache.get(
            guild.id
        );


    if (!cached) {

        await initializeGuildStats(
            guild
        );

        return;
    }


    if (
        member.user.bot
    ) {

        cached.bots =
            Math.max(
                0,
                cached.bots - 1
            );

    } else {

        cached.members =
            Math.max(
                0,
                cached.members - 1
            );

    }


    guildStatsCache.set(
        guild.id,
        cached
    );


    await updateChannels(
        guild
    );
}


// =========================================================
// EVENT PRINCIPAL
// =========================================================

module.exports = async (
    client
) => {

    // =====================================================
    // DEMARRAGE
    // =====================================================

    client.once(
        "clientReady",
        async () => {

            console.log(
                "📊 Synchronisation des statistiques..."
            );


            /*
             * Chaque serveur est chargé une seule fois.
             */

            for (
                const guild
                of client.guilds.cache.values()
            ) {

                await initializeGuildStats(
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
        async member => {

            await handleMemberAdd(
                member
            );

        }
    );


    // =====================================================
    // MEMBRE QUI PART
    // =====================================================

    client.on(
        "guildMemberRemove",
        async member => {

            await handleMemberRemove(
                member
            );

        }
    );

};