const fs = require("fs");
const path = require("path");

const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);


// =========================================================
// CACHE DES COMPTEURS
// =========================================================

const guildStatsCache = new Map();


// =========================================================
// FILE D'ATTENTE DES MISES À JOUR
// =========================================================

const updateTimers = new Map();


// =========================================================
// LECTURE CONFIG
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
// INITIALISATION D'UN SERVEUR
// =========================================================

async function initializeGuildStats(guild) {

    try {

        /*
         * IMPORTANT :
         *
         * NE PAS utiliser guild.members.fetch()
         *
         * guild.memberCount est directement fourni
         * par Discord et évite de récupérer tous
         * les membres du serveur.
         */

        const total =
            guild.memberCount;


        /*
         * On compte uniquement les bots actuellement
         * présents dans le cache Discord.
         *
         * On ne force surtout pas un fetch complet.
         */

        const bots =
            guild.members.cache.filter(
                member =>
                    member.user.bot
            ).size;


        /*
         * Le total Discord est fiable.
         *
         * On déduit les membres humains.
         */

        const members =
            Math.max(
                0,
                total - bots
            );


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
// MISE À JOUR DES CHANNELS
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


        /*
         * Le total vient directement de Discord.
         */

        const total =
            guild.memberCount;


        const members =
            Math.max(
                0,
                total - cached.bots
            );


        const bots =
            cached.bots;


        // =====================================================
        // RÉCUPÉRER LES CHANNELS
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
            "❌ Erreur mise à jour des channels :",
            error
        );

    }

}


// =========================================================
// MISE À JOUR AVEC PETIT DÉLAI
// =========================================================

function queueUpdate(guild) {

    if (
        updateTimers.has(
            guild.id
        )
    ) {

        clearTimeout(
            updateTimers.get(
                guild.id
            )
        );

    }


    const timer =
        setTimeout(
            async () => {

                updateTimers.delete(
                    guild.id
                );


                await updateChannels(
                    guild
                );

            },
            1500
        );


    updateTimers.set(
        guild.id,
        timer
    );

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


    // =====================================================
    // SI LE CACHE N'EXISTE PAS
    // =====================================================

    if (!cached) {

        await initializeGuildStats(
            guild
        );

        return;

    }


    // =====================================================
    // AJOUT
    // =====================================================

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


    /*
     * On attend 1,5 seconde avant de modifier
     * les salons.
     *
     * Si plusieurs personnes rejoignent rapidement,
     * on évite de renommer les salons 15 fois.
     */

    queueUpdate(
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


    // =====================================================
    // SI LE CACHE N'EXISTE PAS
    // =====================================================

    if (!cached) {

        await initializeGuildStats(
            guild
        );

        return;

    }


    // =====================================================
    // RETRAIT
    // =====================================================

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


    queueUpdate(
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
    // DÉMARRAGE
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
    // MEMBRE QUI REJOINT
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