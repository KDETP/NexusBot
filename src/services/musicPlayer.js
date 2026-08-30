const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType
} = require("@discordjs/voice");

const { spawn } = require("child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");
const os = require("os");
const { YtDlp } = require("ytdlp-nodejs");

// ======================================================
// CONFIG
// ======================================================

const FFMPEG_PATH =
    process.platform === "win32"
        ? "C:\\Users\\ausxj\\Desktop\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe"
        : "/usr/bin/ffmpeg";

const YTDLP_PATH =
    process.platform === "win32"
        ? "C:\\Users\\ausxj\\Desktop\\NexusBot\\node_modules\\ytdlp-nodejs\\bin\\yt-dlp.exe"
        : path.join(
            __dirname,
            "..",
            "..",
            "node_modules",
            "ytdlp-nodejs",
            "bin",
            "yt-dlp_linux"
        );

const NODE_PATH = process.execPath;

const AUTO_DISCONNECT_DELAY = 5 * 60 * 1000;
const MAX_STREAM_ATTEMPTS = 1;

// Laisse yt-dlp choisir automatiquement le meilleur client YouTube.
// Le test direct sur le VPS fonctionne avec cette configuration.
const STREAM_CLIENTS = [
    "auto"
];

const guildPlayers = new Map();
const ytdlp = new YtDlp();

// ======================================================
// BASIC YT-DLP ARGUMENTS
// ======================================================

const YTDLP_BASE_ARGS = [
    "--js-runtimes",
    `node:${NODE_PATH}`,

    "--remote-components",
    "ejs:github",

    "--no-playlist",

    "--retries",
    "2",

    "--fragment-retries",
    "2",

    "--extractor-retries",
    "2",

    "--socket-timeout",
    "20",

    "--no-warnings"
];

// ======================================================
// PATH CHECKS
// ======================================================

if (!fs.existsSync(FFMPEG_PATH)) {
    console.error("❌ FFmpeg introuvable !");
    console.error("Chemin :", FFMPEG_PATH);
} else {
    console.log("✅ FFmpeg trouvé :", FFMPEG_PATH);
}

if (!fs.existsSync(YTDLP_PATH)) {
    console.error("❌ yt-dlp introuvable !");
    console.error("Chemin :", YTDLP_PATH);
} else {
    console.log("✅ yt-dlp trouvé :", YTDLP_PATH);
}

console.log("🟢 Node utilisé par yt-dlp :", NODE_PATH);
console.log("🟢 Version Node :", process.version);

// ======================================================
// ARGUMENTS PAR CLIENT
// ======================================================

function getYtDlpArgs() {
    return [
        ...YTDLP_BASE_ARGS
    ];
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

function isSpotifyUrl(text) {
    return /^https?:\/\/(open\.)?spotify\.com\//i.test(text);
}

function cleanSpotifyUrl(url) {
    try {
        const parsed = new URL(url);
        return `https://open.spotify.com${parsed.pathname}`;
    } catch {
        return url;
    }
}

// ======================================================
// SPOTIFY
// ======================================================

function getSpotifyOEmbed(url) {
    return new Promise((resolve, reject) => {
        const spotifyUrl = cleanSpotifyUrl(url);

        const apiUrl =
            `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;

        const request = https.get(
            apiUrl,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            },
            response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        if (response.statusCode !== 200) {
                            throw new Error(
                                `Spotify HTTP ${response.statusCode}`
                            );
                        }

                        const json = JSON.parse(data);

                        if (!json.title) {
                            throw new Error(
                                "Spotify n'a pas retourné le titre."
                            );
                        }

                        resolve({
                            title: json.title,
                            author: json.author_name || "",
                            thumbnail: json.thumbnail_url || null
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on("error", reject);

        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error("Timeout Spotify."));
        });
    });
}

// ======================================================
// INFOS YT-DLP
// ======================================================

function ytDlpInfo(url) {
    // Info/search only. We use a conservative client and NEVER
    // force android_vr.
    return ytdlp.getInfoAsync(url, {
        rawArgs: getYtDlpArgs()
    });
}

// ======================================================
// RECHERCHE YOUTUBE
// ======================================================

async function searchYouTube(query) {
    console.log(`🔎 Recherche YouTube : ${query}`);

    const search = await ytDlpInfoWithFallback(
        `ytsearch5:${query}`
    );

    if (
        !search ||
        !search.entries ||
        !search.entries.length
    ) {
        throw new Error(
            `Aucun résultat trouvé pour "${query}"`
        );
    }

    const tracks = search.entries
        .filter(Boolean)
        .map(video => {
            const url =
                video.webpage_url ||
                video.original_url ||
                (
                    video.id
                        ? `https://www.youtube.com/watch?v=${video.id}`
                        : null
                );

            if (!url) {
                return null;
            }

            return {
                title: video.title || query,
                url: normalizeYouTubeUrl(url),
                thumbnail: video.thumbnail || null,
                duration: video.duration || 0,
                requester: null,
                source: "YouTube"
            };
        })
        .filter(Boolean);

    if (!tracks.length) {
        throw new Error("Aucun résultat YouTube valide.");
    }

    console.log(
        `🎵 ${tracks.length} résultat(s) trouvé(s).`
    );

    tracks.forEach((track, index) => {
        console.log(
            `   ${index + 1}. ${track.title}`
        );
    });

    const first = tracks[0];
    first.alternatives = tracks.slice(1);

    return first;
}

// ======================================================
// NORMALISER UNE URL YOUTUBE
// ======================================================
//
// Supprime les paramètres de playlist (`list`, `index`, etc.)
// et transforme youtu.be en URL vidéo canonique.
// Cela évite qu'un lien `youtu.be/...?...&list=...` soit traité
// comme une playlist pendant l'extraction.
// ======================================================

function normalizeYouTubeUrl(input) {
    const original = String(input).trim();

    try {
        const parsed = new URL(original);
        const host = parsed.hostname.toLowerCase();

        // youtu.be/VIDEO_ID
        if (host === "youtu.be") {
            const id = parsed.pathname
                .replace(/^\/+/, "")
                .split("/")[0];

            if (id) {
                return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
            }
        }

        if (
            host === "youtube.com" ||
            host === "www.youtube.com" ||
            host === "m.youtube.com"
        ) {
            // /watch?v=VIDEO_ID
            const videoId = parsed.searchParams.get("v");

            if (videoId) {
                return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
            }

            // /shorts/VIDEO_ID
            const shortsMatch =
                parsed.pathname.match(/^\/shorts\/([^/?]+)/i);

            if (shortsMatch) {
                return `https://www.youtube.com/watch?v=${encodeURIComponent(shortsMatch[1])}`;
            }

            // /live/VIDEO_ID
            const liveMatch =
                parsed.pathname.match(/^\/live\/([^/?]+)/i);

            if (liveMatch) {
                return `https://www.youtube.com/watch?v=${encodeURIComponent(liveMatch[1])}`;
            }
        }

        return original;
    } catch {
        return original;
    }
}

// ======================================================
// INFOS YT-DLP AVEC FALLBACK CLIENT
// ======================================================

async function ytDlpInfoWithFallback(url) {
    try {
        console.log(
            "🔎 Extraction infos YouTube avec sélection automatique yt-dlp..."
        );

        return await ytdlp.getInfoAsync(
            url,
            {
                rawArgs: getYtDlpArgs()
            }
        );
    } catch (error) {
        throw (
            error ||
            new Error(
                "Impossible de récupérer les informations YouTube."
            )
        );
    }
}

// ======================================================
// RESOLUTION
// ======================================================

async function resolveTrack(query) {
    query = String(query).trim();

    if (!query) {
        throw new Error("Aucune musique indiquée.");
    }

    // ==================================================
    // SPOTIFY
    // ==================================================

    if (isSpotifyUrl(query)) {
        console.log("🟢 Lien Spotify détecté.");

        const spotify = await getSpotifyOEmbed(query);

        let searchQuery = spotify.title;

        if (spotify.author) {
            searchQuery += ` ${spotify.author}`;
        }

        console.log(
            `🎵 Spotify : ${spotify.title}`
        );

        console.log(
            `🔎 Recherche YouTube depuis Spotify : ${searchQuery}`
        );

        const tracks = await searchYouTube(searchQuery);

        const first = tracks[0];

        if (!first) {
            throw new Error(
                "Impossible de convertir le titre Spotify."
            );
        }

        first.thumbnail =
            first.thumbnail ||
            spotify.thumbnail ||
            null;

        first.source = "Spotify → YouTube";

        // Garder les alternatives pour le fallback.
        first.alternatives = tracks.slice(1);

        return first;
    }

    // ==================================================
    // URL DIRECTE
    // ==================================================

    if (isUrl(query)) {
        console.log(`🔗 URL détectée : ${query}`);

        const youtubeUrl = normalizeYouTubeUrl(query);

        if (youtubeUrl !== query) {
            console.log(
                `🔗 URL YouTube normalisée : ${youtubeUrl}`
            );
        }

        const info =
            await ytDlpInfoWithFallback(
                youtubeUrl
            );

        if (!info) {
            throw new Error(
                "Impossible de récupérer cette URL."
            );
        }

        // Si on reçoit malgré tout une playlist,
        // on prend la première entrée disponible.
        if (
            info._type === "playlist" &&
            info.entries &&
            info.entries.length
        ) {
            const first =
                info.entries.find(Boolean);

            if (!first) {
                throw new Error("Playlist vide.");
            }

            const firstUrl =
                first.webpage_url ||
                first.original_url ||
                (
                    first.id
                        ? `https://www.youtube.com/watch?v=${first.id}`
                        : youtubeUrl
                );

            return {
                title:
                    first.title ||
                    info.title ||
                    "Musique",

                url:
                    normalizeYouTubeUrl(
                        firstUrl
                    ),

                thumbnail:
                    first.thumbnail ||
                    null,

                duration:
                    first.duration ||
                    0,

                requester: null,
                source: "YouTube",
                alternatives: []
            };
        }

        const infoUrl =
            info.webpage_url ||
            info.original_url ||
            youtubeUrl;

        return {
            title:
                info.title ||
                "Musique",

            url:
                normalizeYouTubeUrl(
                    infoUrl
                ),

            thumbnail:
                info.thumbnail ||
                null,

            duration:
                info.duration ||
                0,

            requester: null,

            source:
                info.extractor_key ||
                "YouTube",

            alternatives: []
        };
    }

    // ==================================================
    // RECHERCHE LIBRE
    // ==================================================

    console.log(
        `🔎 Recherche par titre : ${query}`
    );

    const tracks =
        await searchYouTube(query);

    const first = tracks[0];

    if (!first) {
        throw new Error(
            "Aucun résultat trouvé."
        );
    }

    first.alternatives =
        tracks.slice(1);

    return first;
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
        return data;
    }

    const connection =
        joinVoiceChannel({
            channelId:
                voiceChannel.id,

            guildId,

            adapterCreator:
                voiceChannel.guild
                    .voiceAdapterCreator,

            selfDeaf: true
        });

    const audioPlayer =
        createAudioPlayer();

    connection.subscribe(
        audioPlayer
    );

    data = {
        connection,
        audioPlayer,

        queue: [],
        current: null,

        volume: 1,
        loop: false,

        processing: false,
        skipping: false,

        idleTimeout: null,

        generation: 0,

        ffmpeg: null,
        ytdlpProcess: null,

        // Fichier audio local : le morceau est téléchargé
        // avant d'être envoyé à Discord. Cela évite qu'une
        // coupure YouTube fasse recommencer la musique.
        audioFile: null,
        audioFileDir: null,

        streamAttempt: 0
    };

    guildPlayers.set(
        guildId,
        data
    );

    // ==================================================
    // ERREUR AUDIO
    // ==================================================

    audioPlayer.on(
        "error",
        error => {
            const currentData =
                guildPlayers.get(
                    guildId
                );

            if (!currentData) {
                return;
            }

            if (
                currentData.skipping
            ) {
                return;
            }

            console.error(
                "❌ Erreur lecteur audio :",
                error
            );

            const track =
                currentData.current;

            currentData.processing =
                false;

            cleanupProcesses(
                currentData
            );

            if (track) {
                retryTrack(
                    guildId,
                    track
                );
            } else {
                playNext(guildId);
            }
        }
    );

    // ==================================================
    // IDLE
    // ==================================================

    audioPlayer.on(
        AudioPlayerStatus.Idle,
        () => {
            const currentData =
                guildPlayers.get(
                    guildId
                );

            if (!currentData) {
                return;
            }

            // Skip : on laisse playNext prendre la queue.
            if (
                currentData.skipping
            ) {
                currentData.skipping =
                    false;

                currentData.current =
                    null;

                currentData.processing =
                    false;

                currentData.streamAttempt =
                    0;

                cleanupProcesses(
                    currentData
                );

                playNext(
                    guildId
                );

                return;
            }

            const finishedTrack =
                currentData.current;

            if (!finishedTrack) {
                currentData.processing =
                    false;

                playNext(
                    guildId
                );

                return;
            }

            console.log(
                `⏹️ Musique terminée : ${finishedTrack.title}`
            );

            cleanupProcesses(
                currentData
            );

            cleanupAudioFile(
                currentData
            );

            // LOOP
            if (
                currentData.loop
            ) {
                currentData.processing =
                    false;

                currentData.streamAttempt =
                    0;

                playTrack(
                    guildId,
                    finishedTrack
                );

                return;
            }

            currentData.current =
                null;

            currentData.processing =
                false;

            currentData.streamAttempt =
                0;

            if (
                currentData.idleTimeout
            ) {
                clearTimeout(
                    currentData.idleTimeout
                );

                currentData.idleTimeout =
                    null;
            }

            playNext(
                guildId
            );
        }
    );

    // ==================================================
    // VOCAL
    // ==================================================

    connection.on(
        VoiceConnectionStatus.Disconnected,
        async () => {
            const currentData =
                guildPlayers.get(
                    guildId
                );

            if (!currentData) {
                return;
            }

            console.log(
                `⚠️ Connexion vocale perdue sur ${guildId}.`
            );

            try {
                await Promise.race([
                    entersState(
                        connection,
                        VoiceConnectionStatus.Signalling,
                        5000
                    ),

                    entersState(
                        connection,
                        VoiceConnectionStatus.Connecting,
                        5000
                    )
                ]);

                console.log(
                    "🔄 Reconnexion vocale..."
                );
            } catch {
                console.error(
                    "❌ Impossible de reconnecter le vocal."
                );

                cleanupProcesses(
                    currentData
                );

                try {
                    connection.destroy();
                } catch {}

                guildPlayers.delete(
                    guildId
                );
            }
        }
    );

    return data;
}

// ======================================================
// NETTOYAGE
// ======================================================

function cleanupAudioFile(data) {
    if (!data) {
        return;
    }

    const file = data.audioFile;
    const dir = data.audioFileDir;

    data.audioFile = null;
    data.audioFileDir = null;

    if (file) {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            console.warn(
                "⚠️ Impossible de supprimer le fichier audio :",
                error?.message || error
            );
        }
    }

    if (dir) {
        try {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, {
                    recursive: true,
                    force: true
                });
            }
        } catch (error) {
            console.warn(
                "⚠️ Impossible de supprimer le dossier temporaire :",
                error?.message || error
            );
        }
    }
}

function cleanupProcesses(data) {
    if (!data) {
        return;
    }

    if (data.ffmpeg) {
        try {
            if (!data.ffmpeg.killed) {
                data.ffmpeg.kill();
            }
        } catch {}

        data.ffmpeg = null;
    }

    if (data.ytdlpProcess) {
        try {
            if (!data.ytdlpProcess.killed) {
                data.ytdlpProcess.kill();
            }
        } catch {}

        data.ytdlpProcess = null;
    }
}

// Compatibilité avec les anciens appels.
function cleanupFFmpeg(data) {
    cleanupProcesses(data);
}

// ======================================================
// TÉLÉCHARGEMENT LOCAL YT-DLP
// ======================================================
//
// IMPORTANT :
// Avant, yt-dlp envoyait directement le flux vers FFmpeg.
// Si YouTube coupait le flux au milieu, FFmpeg s'arrêtait,
// Discord passait en Idle et le bot relançait la musique à 0.
//
// Maintenant :
// YouTube -> yt-dlp -> fichier temporaire local -> FFmpeg -> Discord
//
// La musique est donc indépendante du flux YouTube pendant
// toute sa lecture.
// ======================================================

function createYouTubeProcess(url, outputFile) {
    if (!fs.existsSync(YTDLP_PATH)) {
        throw new Error(
            `yt-dlp introuvable : ${YTDLP_PATH}`
        );
    }

    const args = [
        ...getYtDlpArgs(),

        "--format",
        "bestaudio/best",

        "--output",
        outputFile,

        "--no-part",

        url
    ];

    console.log(
        "🎧 Téléchargement local yt-dlp (client automatique)"
    );

    const child = spawn(
        YTDLP_PATH,
        args,
        {
            windowsHide: true,

            stdio: [
                "ignore",
                "ignore",
                "pipe"
            ]
        }
    );

    child.stderr.on(
        "data",
        chunk => {
            const text = chunk
                .toString()
                .trim();

            if (
                text &&
                !text.includes("[download]")
            ) {
                console.log(
                    `yt-dlp [auto]: ${text}`
                );
            }
        }
    );

    return child;
}

// ======================================================
// FFMPEG DEPUIS UN FICHIER LOCAL
// ======================================================

function createFFmpeg(inputFile) {
    if (!fs.existsSync(FFMPEG_PATH)) {
        throw new Error(
            `FFmpeg introuvable : ${FFMPEG_PATH}`
        );
    }

    if (!fs.existsSync(inputFile)) {
        throw new Error(
            `Fichier audio introuvable : ${inputFile}`
        );
    }

    return spawn(
        FFMPEG_PATH,
        [
            "-hide_banner",
            "-loglevel",
            "error",

            // Fichier local déjà téléchargé.
            "-i",
            inputFile,

            "-vn",

            "-f",
            "s16le",

            "-ar",
            "48000",

            "-ac",
            "2",

            "pipe:1"
        ],
        {
            stdio: [
                "ignore",
                "pipe",
                "pipe"
            ],

            windowsHide: true
        }
    );
}

// ======================================================
// RETRY TRACK
// ======================================================

async function retryTrack(guildId, track) {
    const data = guildPlayers.get(guildId);

    if (!data || data.skipping) {
        return;
    }

    if (
        Array.isArray(track.alternatives) &&
        track.alternatives.length
    ) {
        const alternative =
            track.alternatives.shift();

        console.log(
            `🔄 Résultat suivant : ${alternative.title}`
        );

        alternative.requester =
            track.requester;

        alternative.alternatives =
            track.alternatives;

        data.current =
            alternative;

        data.processing =
            false;

        data.streamAttempt =
            0;

        cleanupProcesses(data);
        cleanupAudioFile(data);

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    400
                )
        );

        await playTrack(
            guildId,
            alternative
        );

        return;
    }

    console.error(
        `❌ Aucun résultat lisible : ${track.title}`
    );

    data.current = null;
    data.processing = false;
    data.streamAttempt = 0;

    cleanupProcesses(data);
    cleanupAudioFile(data);

    await playNext(guildId);
}

// ======================================================
// LECTURE
// ======================================================

async function playTrack(guildId, track) {
    const data =
        guildPlayers.get(guildId);

    if (!data) {
        return;
    }

    if (data.idleTimeout) {
        clearTimeout(
            data.idleTimeout
        );

        data.idleTimeout =
            null;
    }

    // On part sur un nouveau téléchargement.
    cleanupProcesses(data);
    cleanupAudioFile(data);

    data.current =
        track;

    data.processing =
        true;

    data.skipping =
        false;

    data.streamAttempt++;

    const generation =
        ++data.generation;

    console.log(
        `▶️ Lecture : ${track.title}`
    );

    console.log(
        "🔧 Téléchargement avec yt-dlp (sélection automatique)"
    );

    let ytdlpProcess =
        null;

    let ffmpeg =
        null;

    let settled =
        false;

    const fail = async error => {
        if (settled) {
            return;
        }

        settled =
            true;

        const currentData =
            guildPlayers.get(guildId);

        if (
            !currentData ||
            currentData.generation !==
                generation
        ) {
            return;
        }

        if (currentData.skipping) {
            return;
        }

        console.error(
            "❌ Échec lecture (yt-dlp / FFmpeg) :",
            error?.message ||
                error
        );

        cleanupProcesses(currentData);

        currentData.processing =
            false;

        cleanupAudioFile(currentData);

        // Un seul passage vers le résultat suivant.
        // Aucun retry du même morceau => pas de boucle infinie.
        await retryTrack(
            guildId,
            track
        );
    };

    try {
        // ==================================================
        // FICHIER TEMPORAIRE
        // ==================================================

        const tempDir =
            fs.mkdtempSync(
                path.join(
                    os.tmpdir(),
                    "nexusbot-music-"
                )
            );

        const audioFile =
            path.join(
                tempDir,
                "audio"
            );

        data.audioFile =
            audioFile;

        data.audioFileDir =
            tempDir;

        // ==================================================
        // YT-DLP
        // ==================================================

        console.log(
            "📥 Téléchargement complet du morceau..."
        );

        ytdlpProcess =
            createYouTubeProcess(
                track.url,
                audioFile
            );

        data.ytdlpProcess =
            ytdlpProcess;

        await new Promise(
            (resolve, reject) => {
                let done = false;

                const finish = (
                    error
                ) => {
                    if (done) {
                        return;
                    }

                    done = true;

                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                };

                ytdlpProcess.on(
                    "error",
                    finish
                );

                ytdlpProcess.on(
                    "close",
                    code => {
                        if (
                            code !== 0
                        ) {
                            finish(
                                new Error(
                                    `yt-dlp exited with code ${code}`
                                )
                            );

                            return;
                        }

                        if (
                            !fs.existsSync(
                                audioFile
                            )
                        ) {
                            finish(
                                new Error(
                                    "yt-dlp a terminé mais aucun fichier audio n'a été créé."
                                )
                            );

                            return;
                        }

                        const stats =
                            fs.statSync(
                                audioFile
                            );

                        if (
                            !stats.size
                        ) {
                            finish(
                                new Error(
                                    "Le fichier audio téléchargé est vide."
                                )
                            );

                            return;
                        }

                        finish();
                    }
                );
            }
        );

        data.ytdlpProcess =
            null;

        const currentData =
            guildPlayers.get(
                guildId
            );

        if (
            !currentData ||
            currentData.generation !==
                generation
        ) {
            return;
        }

        if (currentData.skipping) {
            cleanupAudioFile(
                currentData
            );

            return;
        }

        console.log(
            `✅ Morceau téléchargé : ${(fs.statSync(audioFile).size / 1024 / 1024).toFixed(2)} Mo`
        );

        // ==================================================
        // FFMPEG
        // ==================================================

        console.log(
            "🎧 Démarrage FFmpeg..."
        );

        ffmpeg =
            createFFmpeg(
                audioFile
            );

        data.ffmpeg =
            ffmpeg;

        ffmpeg.stderr.on(
            "data",
            chunk => {
                const text =
                    chunk
                        .toString()
                        .trim();

                if (text) {
                    console.error(
                        "FFmpeg :",
                        text
                    );
                }
            }
        );

        ffmpeg.on(
            "error",
            error => {
                fail(error);
            }
        );

        // Si FFmpeg se termine avant que Discord
        // ne passe normalement en Idle, on considère
        // cela comme une vraie erreur.
        ffmpeg.on(
            "close",
            code => {
                const currentData =
                    guildPlayers.get(
                        guildId
                    );

                if (
                    !currentData ||
                    currentData.generation !==
                        generation
                ) {
                    return;
                }

                if (
                    currentData.skipping
                ) {
                    return;
                }

                if (
                    code !== 0 &&
                    currentData.processing
                ) {
                    fail(
                        new Error(
                            `FFmpeg exited with code ${code}`
                        )
                    );
                }
            }
        );

        // ==================================================
        // DISCORD RESOURCE
        // ==================================================

        const resource =
            createAudioResource(
                ffmpeg.stdout,
                {
                    inputType:
                        StreamType.Raw,

                    inlineVolume:
                        true
                }
            );

        if (resource.volume) {
            resource.volume.setVolume(
                data.volume
            );
        }

        // ==================================================
        // LANCEMENT
        // ==================================================

        data.audioPlayer.play(
            resource
        );

        console.log(
            `🎶 Lecture lancée : ${track.title}`
        );

        data.audioPlayer.once(
            AudioPlayerStatus.Playing,
            () => {
                const currentData =
                    guildPlayers.get(
                        guildId
                    );

                if (
                    currentData &&
                    currentData.generation ===
                        generation
                ) {
                    currentData.streamAttempt =
                        0;
                }
            }
        );

    } catch (error) {
        await fail(error);
    }
}

//// ======================================================
// PLAY NEXT
// ======================================================

async function playNext(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return;
    }

    if (
        data.processing
    ) {
        return;
    }

    // ==================================================
    // QUEUE VIDE
    // ==================================================

    if (
        !data.queue.length
    ) {
        console.log(
            "📭 File d'attente vide."
        );

        if (
            !data.current &&
            !data.processing &&
            !data.idleTimeout
        ) {
            console.log(
                "⏳ Déconnexion automatique dans 5 minutes."
            );

            data.idleTimeout =
                setTimeout(
                    () => {
                        const currentData =
                            guildPlayers.get(
                                guildId
                            );

                        if (
                            !currentData
                        ) {
                            return;
                        }

                        if (
                            currentData.current ||
                            currentData.processing ||
                            currentData.queue.length
                        ) {
                            currentData.idleTimeout =
                                null;

                            return;
                        }

                        console.log(
                            `👋 Déconnexion du serveur ${guildId}.`
                        );

                        cleanupProcesses(
                            currentData
                        );

                        try {
                            currentData.audioPlayer.stop();
                        } catch {}

                        try {
                            currentData.connection.destroy();
                        } catch {}

                        guildPlayers.delete(
                            guildId
                        );
                    },
                    AUTO_DISCONNECT_DELAY
                );
        }

        return;
    }

    // ==================================================
    // PROCHAIN
    // ==================================================

    const next =
        data.queue.shift();

    data.streamAttempt =
        0;

    await playTrack(
        guildId,
        next
    );
}

// ======================================================
// PLAY MUSIC
// ======================================================

async function playMusic(
    voiceChannel,
    query,
    requester
) {
    const data =
        getGuildPlayer(
            voiceChannel
        );

    await entersState(
        data.connection,
        VoiceConnectionStatus.Ready,
        30_000
    );

    console.log(
        `🎶 Requête reçue : ${query}`
    );

    const track =
        await resolveTrack(
            query
        );

    track.requester =
        requester;

    if (
        !Array.isArray(
            track.alternatives
        )
    ) {
        track.alternatives =
            [];
    }

    // ==================================================
    // RIEN NE JOUE
    // ==================================================

    if (
        !data.current &&
        !data.processing
    ) {
        await playTrack(
            voiceChannel.guild.id,
            track
        );
    }

    // ==================================================
    // UNE MUSIQUE JOUE
    // ==================================================

    else {
        data.queue.push(
            track
        );

        console.log(
            `➕ Ajoutée à la file : ${track.title}`
        );
    }

    return {
        track,

        position:
            data.queue.length
    };
}

// ======================================================
// PAUSE
// ======================================================

function pauseMusic(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return false;
    }

    return data.audioPlayer.pause();
}

// ======================================================
// RESUME
// ======================================================

function resumeMusic(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return false;
    }

    return data.audioPlayer.unpause();
}

// ======================================================
// SKIP
// ======================================================

function skipMusic(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return false;
    }

    if (
        !data.current &&
        !data.processing
    ) {
        return false;
    }

    console.log(
        "⏭️ Skip demandé."
    );

    data.skipping =
        true;

    data.processing =
        false;

    data.current =
        null;

    data.generation++;

    data.streamAttempt =
        0;

    cleanupProcesses(
        data
    );

    cleanupAudioFile(
        data
    );

    try {
        data.audioPlayer.stop();
    } catch {}

    // stop() déclenche Idle et donc playNext().
    return true;
}

// ======================================================
// STOP
// ======================================================

function stopMusic(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return false;
    }

    data.queue =
        [];

    data.current =
        null;

    data.processing =
        false;

    data.skipping =
        true;

    data.generation++;

    data.streamAttempt =
        0;

    cleanupProcesses(
        data
    );

    cleanupAudioFile(
        data
    );

    try {
        data.audioPlayer.stop();
    } catch {}

    if (
        data.idleTimeout
    ) {
        clearTimeout(
            data.idleTimeout
        );

        data.idleTimeout =
            null;
    }

    data.idleTimeout =
        setTimeout(
            () => {
                const currentData =
                    guildPlayers.get(
                        guildId
                    );

                if (
                    !currentData
                ) {
                    return;
                }

                if (
                    currentData.current ||
                    currentData.processing ||
                    currentData.queue.length
                ) {
                    currentData.idleTimeout =
                        null;

                    return;
                }

                console.log(
                    `👋 Déconnexion du serveur ${guildId}.`
                );

                cleanupProcesses(
                    currentData
                );

                cleanupAudioFile(
                    currentData
                );

                try {
                    currentData.connection.destroy();
                } catch {}

                guildPlayers.delete(
                    guildId
                );
            },
            AUTO_DISCONNECT_DELAY
        );

    return true;
}

// ======================================================
// QUEUE
// ======================================================

function getQueue(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return {
            current: null,
            queue: []
        };
    }

    return {
        current:
            data.current,

        queue:
            data.queue
    };
}

// ======================================================
// VOLUME
// ======================================================

function setVolume(
    guildId,
    volume
) {
    const data =
        guildPlayers.get(
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

    data.volume =
        Math.max(
            0,
            Math.min(
                3,
                numericVolume / 100
            )
        );

    return true;
}

// ======================================================
// LOOP
// ======================================================

function toggleLoop(
    guildId
) {
    const data =
        guildPlayers.get(
            guildId
        );

    if (!data) {
        return false;
    }

    data.loop =
        !data.loop;

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
    toggleLoop
};
