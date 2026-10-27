const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { NexusYtDlpPlugin } = require("./nexusYtDlpPlugin");

const ffmpegDiagnostics = new Map();

// Allow the bot's existing FFmpeg install to take priority, then use the
// bundled binary so a separate system-wide installation is not required.
const ffmpegPath = process.env.FFMPEG_PATH || require("ffmpeg-static");

if (ffmpegPath) {
    process.env.FFMPEG_PATH = ffmpegPath;
}

function buildSpotifyOptions() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return {};
    }

    return {
        api: {
            clientId,
            clientSecret,
            topTracksCountry: process.env.SPOTIFY_MARKET || "FR"
        }
    };
}

async function sendToQueue(queue, content) {
    const channel = queue?.textChannel || queue?.metadata?.channel;

    if (!channel?.isTextBased?.()) {
        return;
    }

    try {
        await channel.send(content);
    } catch (error) {
        console.error("Impossible d'envoyer le message du lecteur :", error.message);
    }
}

function sanitizeDiagnostic(value) {
    return String(value || "")
        .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
        .replace(/\s+/g, " ")
        .slice(0, 500);
}

function rememberFfmpegDiagnostic(message) {
    const line = String(message || "");
    const queueId = /^\[([^\]]+)\]/.exec(line)?.[1];

    if (!queueId || !/(\[ffmpeg\] log:|\[process\] error:)/i.test(line)) return;

    const diagnostics = ffmpegDiagnostics.get(queueId) || [];
    diagnostics.push(sanitizeDiagnostic(line));
    ffmpegDiagnostics.set(queueId, diagnostics.slice(-12));
}

function describeMusicError(error, song, diagnostics = []) {
    const detail = `${error?.errorCode || ""} ${error?.message || error || ""} ${diagnostics.join(" ")}`.toLowerCase();
    const trackName = song?.name ? ` (**${song.name}**)` : "";

    if (/http(?: error)? 403|403 forbidden|server returned 403/.test(detail)) {
        return `❌ YouTube a refusé le flux audio de ce morceau${trackName} (HTTP 403). Ça ne veut pas forcément dire qu'il est privé : le format ou l'accès du bot est refusé. Essaie une autre version publique ou réessaie plus tard.`;
    }

    if (detail.includes("private") || detail.includes("unavailable")) {
        return `❌ La plateforme n'a pas pu ouvrir ce contenu${trackName}. Le lien peut être privé, supprimé ou temporairement inaccessible; essaie aussi le titre exact.`;
    }

    if (
        detail.includes("sign in") ||
        detail.includes("confirm you're not a bot") ||
        detail.includes("http error 403") ||
        detail.includes("429")
    ) {
        return `❌ La plateforme bloque temporairement l'accès à ce morceau${trackName}. Réessaie plus tard ou envoie un autre lien public.`;
    }

    if (detail.includes("dépassé le délai") || detail.includes("timed out")) {
        return `❌ La recherche a pris trop de temps${trackName}. Réessaie, ou colle directement un lien public.`;
    }

    if (detail.includes("ffmpeg") || detail.includes("error opening input") || detail.includes("invalid data")) {
        return `❌ Le titre a été trouvé, mais le lecteur n'a pas réussi à ouvrir son flux audio${trackName}. Essaie une autre version publique du morceau.`;
    }

    return `❌ Impossible de récupérer un flux audio pour ce morceau${trackName}. Essaie un autre lien ou le titre exact.`;
}

function createMusicPlayer(client) {
    const ytDlp = new NexusYtDlpPlugin();

    const distube = new DisTube(client, {
        emitNewSongOnly: true,
        ...(ffmpegPath ? { ffmpeg: { path: ffmpegPath } } : {}),
        plugins: [
            new SpotifyPlugin(buildSpotifyOptions()),
            // This resolves titles and public URLs from the supported services,
            // and is also Spotify's streaming fallback.
            ytDlp
        ]
    });

    distube
        .on("ffmpegDebug", rememberFfmpegDiagnostic)
        .on("playSong", (queue, song) =>
            sendToQueue(
                queue,
                `▶️ Lecture : **${song.name}** — demandée par ${song.user}`
            )
        )
        .on("addSong", (queue, song) =>
            sendToQueue(
                queue,
                `➕ Ajouté à la file : **${song.name}** — demandé par ${song.user}`
            )
        )
        .on("addList", (queue, playlist) =>
            sendToQueue(
                queue,
                `➕ Playlist ajoutée : **${playlist.name}** (${playlist.songs.length} morceaux).`
            )
        )
        .on("error", (error, queue, song) => {
            const diagnostics = ffmpegDiagnostics.get(queue?.id) || [];
            const safeDetails = diagnostics.filter(line => /403|forbidden|error|failed/i.test(line));

            console.error("Erreur du lecteur audio :", {
                code: error?.errorCode || error?.name || "erreur inconnue",
                message: sanitizeDiagnostic(error?.message || error),
                ffmpeg: safeDetails.slice(-4)
            });
            ffmpegDiagnostics.delete(queue?.id);

            return sendToQueue(queue, describeMusicError(error, song, diagnostics));
        })
        .on("deleteQueue", queue => ffmpegDiagnostics.delete(queue?.id));

    return distube;
}

module.exports = { createMusicPlayer };
