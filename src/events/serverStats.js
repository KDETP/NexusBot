const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits } = require("discord.js");


// =========================================================
// CONFIGURATION DES SALONS
// =========================================================

const STATS = {
    category: "1535298730528350218",
    total: "1535298731908538480",
    members: "1535298733208641566",
    bots: "1535298734382911548"
};


// =========================================================
// FICHIER DE CONFIGURATION
// =========================================================

const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);


// =========================================================
// CACHE
// =========================================================

const guildStatsCache = new Map();

let initialized = false;


// =========================================================
// SAUVEGARDE DE LA CONFIG
// =========================================================

function ensureStatsFile() {

    try {

        if (!fs.existsSync(statsPath)) {

            fs.writeFileSync(
                statsPath,
                JSON.stringify(
                    STATS,
                    null,
                    4
                ),
                "utf8"
            );

        }

    } catch (error) {

        console.error(
            "❌ Impossible de créer serverStats.json :",
            error.message
        );

    }

}


// =========================================================
// RÉCUPÉRER LES SALONS
// =========================================================

async function getStatsChannels(guild) {

    const totalChannel =
        await guild.channels.fetch(
            STATS.total
        ).catch(() => null);


    const membersChannel =
        await guild.channels.fetch(
            STATS.members
        ).catch(() => null);


    const botsChannel =
        await guild.channels.fetch(
            STATS.bots
        ).catch(() => null);


    return {
        totalChannel,
        membersChannel,
        botsChannel
    };

}


// =========================================================
// VÉRIFIER LES PERMISSIONS
// =========================================================

function canManageChannel(
    guild,
    channel
) {

    if (
        !channel ||
        !guild.members.me
    ) {

        return false;

    }


    const permissions =
        channel.permissionsFor(
            guild.members.me
        );


    return Boolean(
        permissions?.has(
            PermissionFlagsBits.ManageChannels
        )
    );

}


// =========================================================
// COMPTER LES BOTS
// =========================================================

async function countBots(guild) {

    try {

        /*
         * UN SEUL fetch complet au démarrage.
         *
         * Il n'est jamais appelé lors d'un join
         * ou d'un départ.
         */

        await guild.members.fetch();


        return guild.members.cache.filter(
            member =>
                member.user.bot
        ).size;


    } catch (error) {

        console.warn(
            `⚠️ Impossible de récupérer tous les membres de ${guild.name}.`
        );


        /*
         * Si Discord refuse le fetch,
         * on utilise au minimum le cache.
         */

        return guild.members.cache.filter(
            member =>
                member.user.bot
        ).size;

    }

}


// =========================================================
// INITIALISATION DU SERVEUR
// =========================================================

async function initializeGuildStats(
    guild
) {

    try {

        const total =
            guild.memberCount;


        const bots =
            await countBots(
                guild
            );


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
            `📊 Cache membres initialisé : ${guild.name} → ` +
            `${members} membres | ${bots} bots`
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
// METTRE À JOUR LES SALONS
// =========================================================

async function updateChannels(
    guild
) {

    try {

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


        /*
         * Le nombre de bots est maintenu
         * par les événements join / leave.
         */

        const bots =
            Math.max(
                0,
                cached.bots
            );


        const members =
            Math.max(
                0,
                total - bots
            );


        const {
            totalChannel,
            membersChannel,
            botsChannel
        } =
            await getStatsChannels(
                guild
            );


        // =====================================================
        // TOTAL
        // =====================================================

        if (!totalChannel) {

            console.error(
                `❌ Salon TOTAL introuvable : ${STATS.total}`
            );

        } else if (
            !canManageChannel(
                guild,
                totalChannel
            )
        ) {

            console.error(
                `❌ Permission ManageChannels manquante sur : ${totalChannel.name}`
            );

        } else {

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

        if (!membersChannel) {

            console.error(
                `❌ Salon MEMBRES introuvable : ${STATS.members}`
            );

        } else if (
            !canManageChannel(
                guild,
                membersChannel
            )
        ) {

            console.error(
                `❌ Permission ManageChannels manquante sur : ${membersChannel.name}`
            );

        } else {

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

        if (!botsChannel) {

            console.error(
                `❌ Salon BOTS introuvable : ${STATS.bots}`
            );

        } else if (
            !canManageChannel(
                guild,
                botsChannel
            )
        ) {

            console.error(
                `❌ Permission ManageChannels manquante sur : ${botsChannel.name}`
            );

        } else {

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
            `📊 Stats mises à jour : ` +
            `${total} total | ` +
            `${members} membres | ` +
            `${bots} bots`
        );


    } catch (error) {

        console.error(
            "❌ Erreur mise à jour des stats :",
            error
        );

    }

}


// =========================================================
// MEMBRE QUI REJOINT
// =========================================================

async function handleMemberAdd(
    member
) {

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


    /*
     * Si c'est un bot, on augmente
     * le compteur de bots.
     */

    if (
        member.user.bot
    ) {

        cached.bots++;

    }


    guildStatsCache.set(
        guild.id,
        cached
    );


    /*
     * MISE À JOUR IMMÉDIATE
     */

    await updateChannels(
        guild
    );

}


// =========================================================
// MEMBRE QUI PART
// =========================================================

async function handleMemberRemove(
    member
) {

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


    /*
     * Si c'est un bot, on retire
     * un bot du compteur.
     */

    if (
        member.user.bot
    ) {

        cached.bots =
            Math.max(
                0,
                cached.bots - 1
            );

    }


    guildStatsCache.set(
        guild.id,
        cached
    );


    /*
     * MISE À JOUR IMMÉDIATE
     */

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

    /*
     * Empêche une double initialisation
     * du système.
     */

    if (initialized) {

        return;

    }


    initialized = true;


    ensureStatsFile();


    // =====================================================
    // DÉMARRAGE DU BOT
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