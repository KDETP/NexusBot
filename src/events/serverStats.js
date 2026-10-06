const fs = require("fs");
const path = require("path");
const { PermissionFlagsBits } = require("discord.js");

const STATS = {
    category: "1535298730528350218",
    total: "1535298731908538480",
    members: "1535298733208641566",
    bots: "1535298734382911548"
};

const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);

const guildStatsCache = new Map();
const updateTimers = new Map();
let initialized = false;

function ensureStatsFile() {
    try {
        fs.writeFileSync(
            statsPath,
            JSON.stringify(STATS, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error(
            "❌ Impossible d'écrire serverStats.json :",
            error.message
        );
    }
}

async function getStatsChannels(guild) {
    const totalChannel = await guild.channels
        .fetch(STATS.total)
        .catch(() => null);

    const membersChannel = await guild.channels
        .fetch(STATS.members)
        .catch(() => null);

    const botsChannel = await guild.channels
        .fetch(STATS.bots)
        .catch(() => null);

    return {
        totalChannel,
        membersChannel,
        botsChannel
    };
}

function canManageChannel(guild, channel) {
    if (!channel || !guild.members.me) {
        return false;
    }

    return channel
        .permissionsFor(guild.members.me)
        ?.has(PermissionFlagsBits.ManageChannels) || false;
}

async function countBots(guild) {
    try {
        /*
         * Une seule récupération complète au démarrage.
         * Aucun fetch complet lors des joins/leaves.
         */
        await guild.members.fetch();

        return guild.members.cache.filter(
            member => member.user.bot
        ).size;

    } catch (error) {
        console.warn(
            `⚠️ Impossible de récupérer tous les membres de ${guild.name}. ` +
            "Utilisation du cache pour les bots."
        );

        return guild.members.cache.filter(
            member => member.user.bot
        ).size;
    }
}

async function initializeGuildStats(guild) {
    try {
        const total = guild.memberCount;
        const bots = await countBots(guild);
        const members = Math.max(0, total - bots);

        guildStatsCache.set(guild.id, {
            members,
            bots
        });

        console.log(
            `📊 Cache membres initialisé : ${guild.name} → ` +
            `${members} membres | ${bots} bots`
        );

        await updateChannels(guild);

    } catch (error) {
        console.error(
            `❌ Erreur initialisation stats ${guild.name} :`,
            error
        );
    }
}

async function updateChannels(guild) {
    try {
        const cached = guildStatsCache.get(guild.id);

        if (!cached) {
            return;
        }

        const total = guild.memberCount;
        const bots = Math.max(0, cached.bots);
        const members = Math.max(0, total - bots);

        const {
            totalChannel,
            membersChannel,
            botsChannel
        } = await getStatsChannels(guild);

        if (!totalChannel) {
            console.error(
                `❌ Salon TOTAL introuvable : ${STATS.total}`
            );
        } else if (!canManageChannel(guild, totalChannel)) {
            console.error(
                `❌ ManageChannels manquant sur : ${totalChannel.name}`
            );
        } else {
            const name = `🌎 Total : ${total}`;

            if (totalChannel.name !== name) {
                await totalChannel.setName(name);
            }
        }

        if (!membersChannel) {
            console.error(
                `❌ Salon MEMBRES introuvable : ${STATS.members}`
            );
        } else if (!canManageChannel(guild, membersChannel)) {
            console.error(
                `❌ ManageChannels manquant sur : ${membersChannel.name}`
            );
        } else {
            const name = `👥 Membres : ${members}`;

            if (membersChannel.name !== name) {
                await membersChannel.setName(name);
            }
        }

        if (!botsChannel) {
            console.error(
                `❌ Salon BOTS introuvable : ${STATS.bots}`
            );
        } else if (!canManageChannel(guild, botsChannel)) {
            console.error(
                `❌ ManageChannels manquant sur : ${botsChannel.name}`
            );
        } else {
            const name = `🤖 Bots : ${bots}`;

            if (botsChannel.name !== name) {
                await botsChannel.setName(name);
            }
        }

        console.log(
            `📊 Stats mises à jour : ` +
            `${total} total | ${members} membres | ${bots} bots`
        );

    } catch (error) {
        console.error(
            "❌ Erreur mise à jour des stats :",
            error
        );
    }
}

function queueUpdate(guild) {
    const existing = updateTimers.get(guild.id);

    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
        updateTimers.delete(guild.id);
        await updateChannels(guild);
    }, 1500);

    updateTimers.set(guild.id, timer);
}

async function handleMemberAdd(member) {
    const guild = member.guild;

    let cached = guildStatsCache.get(guild.id);

    if (!cached) {
        await initializeGuildStats(guild);
        return;
    }

    if (member.user.bot) {
        cached.bots++;
    }

    guildStatsCache.set(guild.id, cached);
    queueUpdate(guild);
}

async function handleMemberRemove(member) {
    const guild = member.guild;

    let cached = guildStatsCache.get(guild.id);

    if (!cached) {
        await initializeGuildStats(guild);
        return;
    }

    if (member.user.bot) {
        cached.bots = Math.max(0, cached.bots - 1);
    }

    guildStatsCache.set(guild.id, cached);
    queueUpdate(guild);
}

module.exports = async client => {
    if (initialized) {
        return;
    }

    initialized = true;

    ensureStatsFile();

    client.once("clientReady", async () => {
        console.log(
            "📊 Synchronisation des statistiques..."
        );

        for (const guild of client.guilds.cache.values()) {
            await initializeGuildStats(guild);
        }

        console.log(
            "✅ Statistiques synchronisées."
        );
    });

    client.on("guildMemberAdd", async member => {
        await handleMemberAdd(member);
    });

    client.on("guildMemberRemove", async member => {
        await handleMemberRemove(member);
    });
};