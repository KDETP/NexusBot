const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { NexusYtDlpPlugin } = require("./nexusYtDlpPlugin");

// `ffmpeg-static` keeps the bot portable: it does not depend on a global FFmpeg
// installation on the host machine.
const ffmpegPath = require("ffmpeg-static");

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

function describeMusicError(error, song) {
    const detail = String(error?.message || error || "").toLowerCase();
    const trackName = song?.name ? ` (**${song.name}**)` : "";

    if (detail.includes("private") || detail.includes("unavailable")) {
        return `❌ Ce contenu n'est pas accessible${trackName}. Il est probablement privé, supprimé ou indisponible dans cette région.`;
    }

    if (
        detail.includes("sign in") ||
        detail.includes("confirm you're not a bot") ||
        detail.includes("http error 403")
    ) {
        return `❌ La plateforme a temporairement refusé l'accès à ce morceau${trackName}. Réessaie dans quelques minutes.`;
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
            console.error("Erreur du lecteur audio :", error.message);

            return sendToQueue(queue, describeMusicError(error, song));
        });

    return distube;
}

module.exports = { createMusicPlayer };
