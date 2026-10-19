const path = require("node:path");
const { spawn } = require("node:child_process");
const {
    DisTubeError,
    ExtractorPlugin,
    Playlist,
    Song
} = require("distube");

// The package supplies and updates the yt-dlp executable. We use a small local
// wrapper because its current plugin passes a deprecated option that breaks
// JSON parsing with the current yt-dlp release.
const ytDlpPath = path.join(
    path.dirname(require.resolve("@distube/yt-dlp")),
    "..",
    "bin",
    process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

function runYtDlp(input, extraArgs = []) {
    const args = [
        input,
        "--dump-single-json",
        "--no-warnings",
        "--skip-download",
        "--simulate",
        "--prefer-free-formats",
        ...extraArgs
    ];

    return new Promise((resolve, reject) => {
        const process = spawn(ytDlpPath, args, { windowsHide: true });
        let stdout = "";
        let stderr = "";

        process.stdout.on("data", chunk => {
            stdout += chunk;
        });

        process.stderr.on("data", chunk => {
            stderr += chunk;
        });

        process.once("error", reject);
        process.once("close", code => {
            if (code !== 0) {
                reject(new Error(stderr || stdout || `yt-dlp a quitté avec le code ${code}.`));
                return;
            }

            try {
                resolve(JSON.parse(stdout));
            } catch (error) {
                reject(error);
            }
        });
    });
}

function toSong(plugin, info, options) {
    return new Song(
        {
            plugin,
            source: info.extractor_key || info.extractor || "yt-dlp",
            playFromSource: true,
            id: String(info.id || info.webpage_url || info.original_url),
            name: info.title || info.fulltitle || "Sans titre",
            url: info.webpage_url || info.original_url,
            isLive: Boolean(info.is_live),
            duration: info.is_live ? 0 : Number(info.duration) || 0,
            thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
            uploader: {
                name: info.uploader,
                url: info.uploader_url
            },
            views: info.view_count,
            likes: info.like_count,
            dislikes: info.dislike_count,
            reposts: info.repost_count,
            ageRestricted: Number(info.age_limit) >= 18
        },
        options
    );
}

class NexusYtDlpPlugin extends ExtractorPlugin {
    validate() {
        return true;
    }

    async resolve(input, options) {
        try {
            const info = await runYtDlp(input);

            if (Array.isArray(info.entries)) {
                if (!info.entries.length) {
                    throw new Error("La playlist ne contient aucun morceau.");
                }

                return new Playlist(
                    {
                        source: info.extractor_key || info.extractor || "yt-dlp",
                        id: String(info.id || input),
                        name: info.title || "Playlist sans titre",
                        url: info.webpage_url || info.original_url || input,
                        thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
                        songs: info.entries.map(entry => toSong(this, entry, options))
                    },
                    options
                );
            }

            return toSong(this, info, options);
        } catch (error) {
            throw new DisTubeError("YTDLP_ERROR", error.message || String(error));
        }
    }

    async searchSong(query, options) {
        const result = await this.resolve(`ytsearch1:${query}`, options);

        return result instanceof Playlist ? result.songs[0] || null : result;
    }

    async getStreamURL(song) {
        if (!song.url) {
            throw new DisTubeError(
                "YTDLP_PLUGIN_INVALID_SONG",
                "Le morceau ne possède pas de lien source."
            );
        }

        try {
            const info = await runYtDlp(song.url, ["--format", "ba/ba*"]);

            if (!info.url) {
                throw new Error("yt-dlp n'a retourné aucun flux audio.");
            }

            return info.url;
        } catch (error) {
            throw new DisTubeError("YTDLP_ERROR", error.message || String(error));
        }
    }

    getRelatedSongs() {
        return [];
    }
}

module.exports = { NexusYtDlpPlugin, ytDlpPath };
