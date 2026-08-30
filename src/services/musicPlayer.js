const guildPlayers = new Map();

const AUTO_DISCONNECT_DELAY = 5 * 60 * 1000;


// ======================================================
// LAVALINK
// ======================================================

function getLavalinkManager(channel) {

    const client = channel?.client;

    if (!client?.lavalink) {
        throw new Error(
            "Lavalink n'est pas initialisé."
        );
    }

    return client.lavalink;
}


// ======================================================
// UTILITAIRES
// ======================================================

function isUrl(text) {

    try {

        new URL(text);

        return true;

    } catch {

        return false;

    }

}


function formatTrack(track, requester = null) {

    if (!track) {
        return null;
    }

    const info =
        track.info || {};

    return {

        // Track Lavalink original
        lavalinkTrack: track,

        // Infos utilisées par ton bot
        title:
            info.title ||
            "Musique",

        url:
            info.uri ||
            info.url ||
            null,

        thumbnail:
            info.artworkUrl ||
            null,

        duration:
            info.length ||
            0,

        requester,

        source:
            info.sourceName ||
            "YouTube"

    };

}


// ======================================================
// PLAYER PAR SERVEUR
// ======================================================

function getGuildPlayer(voiceChannel) {

    const guildId =
        voiceChannel.guild.id;

    let data =
        guildPlayers.get(guildId);


    if (data) {

        // Si le joueur existe mais que le salon vocal
        // a changé, on le reconnectera dans playMusic().
        return data;

    }


    const manager =
        getLavalinkManager(
            voiceChannel
        );


    const player =
        manager.createPlayer({

            guildId,

            voiceChannelId:
                voiceChannel.id,

            textChannelId:
                null,

            selfDeaf:
                true,

            selfMute:
                false,

            volume:
                100

        });


    data = {

        player,

        queue: [],

        current: null,

        volume: 100,

        loop: false,

        idleTimeout: null

    };


    guildPlayers.set(
        guildId,
        data
    );


    return data;

}


// ======================================================
// CONNEXION VOCALE
// ======================================================

async function ensureVoiceConnection(
    voiceChannel,
    data
) {

    const player =
        data.player;


    // Le joueur est déjà dans le bon salon.
    if (
        player.connected &&
        player.voiceChannelId ===
            voiceChannel.id
    ) {

        return;

    }


    // Si le joueur existe mais est dans
    // un autre salon, on le déplace.
    if (
        player.connected &&
        player.voiceChannelId !==
            voiceChannel.id
    ) {

        await player.changeVoiceChannel(
            voiceChannel.id
        );

        return;

    }


    // Première connexion.
    await player.connect();

}


// ======================================================
// RECHERCHE YOUTUBE
// ======================================================

async function searchTrack(
    player,
    query,
    requester
) {

    console.log(
        `🔎 Recherche Lavalink : ${query}`
    );


    const searchQuery =
        isUrl(query)
            ? query
            : query;


    const result =
        await player.search(

            {

                query:
                    searchQuery,

                source:
                    isUrl(query)
                        ? undefined
                        : "ytsearch"

            },

            requester

        );


    if (
        !result ||
        !result.tracks ||
        !result.tracks.length
    ) {

        throw new Error(
            `Aucun résultat YouTube pour "${query}".`
        );

    }


    console.log(
        `🎵 ${result.tracks.length} résultat(s) Lavalink trouvé(s).`
    );


    return result.tracks[0];

}


// ======================================================
// LECTURE
// ======================================================

async function playMusic(
    voiceChannel,
    query,
    requester
) {

    query =
        String(query || "")
            .trim();


    if (!query) {

        throw new Error(
            "Aucune musique indiquée."
        );

    }


    const data =
        getGuildPlayer(
            voiceChannel
        );


    const player =
        data.player;


    // Annuler une éventuelle déconnexion.
    if (data.idleTimeout) {

        clearTimeout(
            data.idleTimeout
        );

        data.idleTimeout =
            null;

    }


    // ==================================================
    // CONNEXION AU VOCAL
    // ==================================================

    await ensureVoiceConnection(
        voiceChannel,
        data
    );


    // ==================================================
    // RECHERCHE
    // ==================================================

    const lavalinkTrack =
        await searchTrack(
            player,
            query,
            requester
        );


    const track =
        formatTrack(
            lavalinkTrack,
            requester
        );


    if (!track) {

        throw new Error(
            "Impossible de construire la musique."
        );

    }


    // Garder le track Lavalink.
    track.lavalinkTrack =
        lavalinkTrack;


    // ==================================================
    // AJOUT À LA FILE
    // ==================================================

    const wasPlaying =
        player.playing ||
        player.paused ||
        !!player.queue.current;


    await player.queue.add(
        lavalinkTrack
    );


    // ==================================================
    // RIEN NE JOUE
    // ==================================================

    if (!wasPlaying) {

        await player.play();

        data.current =
            track;

    }


    // ==================================================
    // UNE MUSIQUE JOUE DÉJÀ
    // ==================================================

    else {

        data.queue.push(
            track
        );

    }


    console.log(
        `🎶 Musique ajoutée : ${track.title}`
    );


    return {

        track,

        position:
            data.queue.length

    };

}


// ======================================================
// SYNCHRONISATION DE LA QUEUE
// ======================================================

function syncQueueData(
    guildId
) {

    const data =
        guildPlayers.get(
            guildId
        );


    if (!data) {

        return;

    }


    const player =
        data.player;


    data.current =
        player.queue.current
            ? formatTrack(
                player.queue.current,
                player.queue.current.requester
            )
            : null;


    data.queue =
        player.queue.tracks.map(
            track =>
                formatTrack(
                    track,
                    track.requester
                )
        );

}


// ======================================================
// ÉVÉNEMENTS LAVALINK
// ======================================================

function setupLavalinkEvents(
    manager
) {

    if (
        manager.__nexusMusicEvents
    ) {

        return;

    }


    manager.__nexusMusicEvents =
        true;


    // ----------------------------------------------
    // TRACK START
    // ----------------------------------------------

    manager.on(
        "trackStart",
        (
            player,
            track
        ) => {

            const data =
                guildPlayers.get(
                    player.guildId
                );


            if (!data) {
                return;
            }


            data.current =
                formatTrack(
                    track,
                    track.requester
                );


            console.log(
                `▶️ Lecture : ${track.info?.title || "Musique"}`
            );

        }
    );


    // ----------------------------------------------
    // TRACK END
    // ----------------------------------------------

    manager.on(
        "trackEnd",
        (
            player,
            track
        ) => {

            const data =
                guildPlayers.get(
                    player.guildId
                );


            if (!data) {
                return;
            }


            console.log(
                `⏹️ Musique terminée : ${track.info?.title || "Musique"}`
            );


            if (data.loop) {

                // On remet la musique terminée
                // en tête de la queue.
                player.queue.add(
                    track,
                    0
                );

                return;

            }


            syncQueueData(
                player.guildId
            );

        }
    );


    // ----------------------------------------------
    // TRACK ERROR
    // ----------------------------------------------

    manager.on(
        "trackError",
        (
            player,
            track,
            payload
        ) => {

            console.error(
                `❌ Erreur Lavalink : ${track?.info?.title || "Musique"}`
            );

            console.error(
                payload
            );

        }
    );


    // ----------------------------------------------
    // TRACK STUCK
    // ----------------------------------------------

    manager.on(
        "trackStuck",
        (
            player,
            track,
            payload
        ) => {

            console.error(
                `⚠️ Track bloqué : ${track?.info?.title || "Musique"}`
            );

            console.error(
                payload
            );

        }
    );


    // ----------------------------------------------
    // QUEUE END
    // ----------------------------------------------

    manager.on(
        "queueEnd",
        player => {

            const data =
                guildPlayers.get(
                    player.guildId
                );


            if (!data) {
                return;
            }


            data.current =
                null;


            data.queue =
                [];


            console.log(
                "📭 File musicale terminée."
            );


            if (
                data.idleTimeout
            ) {

                clearTimeout(
                    data.idleTimeout
                );

            }


            data.idleTimeout =
                setTimeout(
                    async () => {

                        const currentData =
                            guildPlayers.get(
                                player.guildId
                            );


                        if (
                            !currentData
                        ) {

                            return;

                        }


                        if (
                            player.playing ||
                            player.paused ||
                            player.queue.tracks.length
                        ) {

                            currentData.idleTimeout =
                                null;

                            return;

                        }


                        console.log(
                            `👋 Déconnexion du serveur ${player.guildId}.`
                        );


                        try {

                            await player.disconnect(
                                true
                            );

                        } catch {}

                        try {

                            player.destroy();

                        } catch {}


                        guildPlayers.delete(
                            player.guildId
                        );

                    },

                    AUTO_DISCONNECT_DELAY

                );

        }
    );

}


// ======================================================
// INITIALISATION DES EVENTS
// ======================================================

function getPlayerData(
    guildId
) {

    const data =
        guildPlayers.get(
            guildId
        );


    if (!data) {
        return null;
    }


    return data;

}


// ======================================================
// PAUSE
// ======================================================

async function pauseMusic(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    await data.player.pause();

    return true;

}


// ======================================================
// RESUME
// ======================================================

async function resumeMusic(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    await data.player.resume();

    return true;

}


// ======================================================
// SKIP
// ======================================================

async function skipMusic(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    try {

        await data.player.skip(
            0,
            false
        );

        return true;

    } catch {

        return false;

    }

}


// ======================================================
// STOP
// ======================================================

async function stopMusic(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    try {

        await data.player.stopPlaying(
            true,
            false
        );

    } catch {}


    data.current =
        null;


    data.queue =
        [];


    data.loop =
        false;


    if (
        data.idleTimeout
    ) {

        clearTimeout(
            data.idleTimeout
        );

    }


    data.idleTimeout =
        null;


    return true;

}


// ======================================================
// QUEUE
// ======================================================

function getQueue(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {

        return {

            current: null,

            queue: []

        };

    }


    const player =
        data.player;


    return {

        current:
            player.queue.current
                ? formatTrack(
                    player.queue.current,
                    player.queue.current.requester
                )
                : null,

        queue:
            player.queue.tracks.map(
                track =>
                    formatTrack(
                        track,
                        track.requester
                    )
            )

    };

}


// ======================================================
// VOLUME
// ======================================================

async function setVolume(
    guildId,
    volume
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    const numericVolume =
        Number(volume);


    if (
        !Number.isFinite(
            numericVolume
        )
    ) {

        return false;

    }


    const finalVolume =
        Math.max(
            0,
            Math.min(
                100,
                numericVolume
            )
        );


    await data.player.setVolume(
        finalVolume
    );


    data.volume =
        finalVolume;


    return true;

}


// ======================================================
// LOOP
// ======================================================

async function toggleLoop(
    guildId
) {

    const data =
        getPlayerData(
            guildId
        );


    if (!data) {
        return false;
    }


    data.loop =
        !data.loop;


    // Lavalink ne doit pas répéter lui-même
    // puisqu'on gère le loop avec trackEnd.
    await data.player.setRepeatMode(
        "off"
    );


    return data.loop;

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    playMusic,
    pauseMusic,
    resumeMusic,
    skipMusic,
    stopMusic,
    getQueue,
    setVolume,
    toggleLoop,
    setupLavalinkEvents
};