const path = require("node:path");
const { spawn } = require("node:child_process");
const { download: downloadLatestYtDlp } = require("@distube/yt-dlp");
const {
    DisTubeError,
    ExtractorPlugin,
    Playlist,
    Song
} = require("distube");

// Keep the executable configurable for hosts that install yt-dlp themselves.
const bundledYtDlpPath = path.join(
    path.dirname(require.resolve("@distube/yt-dlp")),
    "..",
    "bin",
    process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

const ytDlpPath = process.env.YTDLP_PATH || bundledYtDlpPath;
const ytDlpCachePath = process.env.YTDLP_CACHE_DIR || path.join(
    __dirname,
    "..",
    "..",
    "node_modules",
    ".cache",
    "yt-dlp"
);
const MAX_PLAYLIST_SIZE = 50;
const MAX_OUTPUT_SIZE = 6 * 1024 * 1024;
const STREAM_PROBE_TIMEOUT_MS = 5000;
const VERIFIED_STREAM_MAX_AGE_MS = 30000;
const YTDLP_UPDATE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const YTDLP_TIMEOUT_MS = Math.max(
    10000,
    Number(process.env.YTDLP_TIMEOUT_MS) || 45000
);

function sanitizeDiagnostic(value) {
    return String(value || "Erreur inconnue")
        .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
        .replace(/\s+/g, " ")
        .slice(0, 600);
}

function getInstalledYtDlpVersion() {
    return new Promise((resolve, reject) => {
        const child = spawn(ytDlpPath, ["--version"], { windowsHide: true });
        let stdout = "";
        let stderr = "";

        child.stdout.on("data", chunk => {
            stdout += chunk;
        });
        child.stderr.on("data", chunk => {
            stderr += chunk;
        });
        child.once("error", reject);
        child.once("close", code => {
            if (code === 0 && stdout.trim()) {
                resolve(stdout.trim());
            } else {
                reject(new Error(stderr.trim() || "Impossible de lire la version de yt-dlp."));
            }
        });
    });
}

async function waitForYtDlpVersion(expectedVersion, previousVersion) {
    const deadline = Date.now() + 15000;

    while (Date.now() < deadline) {
        try {
            const installedVersion = await getInstalledYtDlpVersion();

            if (
                installedVersion === expectedVersion ||
                (expectedVersion === "latest" && installedVersion !== previousVersion)
            ) {
                return true;
            }
        } catch {
            // The update helper writes the executable asynchronously; retry briefly.
        }

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    return false;
}

async function updateYtDlpIfStale() {
    if (process.env.YTDLP_DISABLE_DOWNLOAD || process.env.YTDLP_PATH) return;

    let installedVersion = null;

    try {
        installedVersion = await getInstalledYtDlpVersion();
    } catch {
        // A missing or broken executable should trigger a download attempt.
    }

    const installedDate = /^\d{4}\.\d{2}\.\d{2}$/.test(installedVersion || "")
        ? Date.parse(`${installedVersion.replace(/\./g, "-")}T00:00:00Z`)
        : 0;

    if (installedDate && Date.now() - installedDate < YTDLP_UPDATE_AFTER_MS) return;

    const latestVersion = await downloadLatestYtDlp();

    if (
        latestVersion !== installedVersion &&
        !await waitForYtDlpVersion(latestVersion, installedVersion)
    ) {
        throw new Error("Le nouvel exécutable yt-dlp n'a pas pu être installé.");
    }

    console.info(`yt-dlp mis à jour (${latestVersion}).`);
}

function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Délai de mise à jour dépassé (${timeoutMs / 1000} s).`)),
            timeoutMs
        );

        promise.then(
            value => {
                clearTimeout(timer);
                resolve(value);
            },
            error => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}

// YouTube changes frequently. Refresh the bundled executable weekly, while
// continuing to use the installed copy if the host has no network access.
const ytDlpUpdatePromise = withTimeout(updateYtDlpIfStale(), 20000).catch(error => {
    console.warn("Mise à jour yt-dlp impossible; conservation de la version installée :", error.message);
});

function getInputOptions(input) {
    const options = ["--playlist-end", String(MAX_PLAYLIST_SIZE)];

    try {
        const url = new URL(input);
        const isYouTube = /(^|\.)youtube\.com$/i.test(url.hostname);

        // A shared watch link often includes its source playlist. Play only the
        // requested video; a playlist-only URL is still expanded (up to 50).
        if (isYouTube && url.searchParams.has("v") && url.searchParams.has("list")) {
            options.push("--no-playlist");
        }
    } catch {
        // Search expressions (for example ytsearch5:...) are not URLs.
    }

    return options;
}

function runYtDlp(input, extraArgs = []) {
    const args = [
        "--ignore-config",
        "--dump-single-json",
        "--no-warnings",
        "--skip-download",
        "--simulate",
        "--prefer-free-formats",
        "--js-runtimes",
        `node:${process.execPath}`,
        "--remote-components",
        "ejs:github",
        "--cache-dir",
        ytDlpCachePath,
        ...getInputOptions(input),
        ...extraArgs,
        "--",
        input
    ];

    return ytDlpUpdatePromise.then(() => new Promise((resolve, reject) => {
        const child = spawn(ytDlpPath, args, { windowsHide: true });
        let stdout = "";
        let stderr = "";
        let settled = false;
        let outputTooLarge = false;
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, YTDLP_TIMEOUT_MS);

        const fail = error => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(error);
        };

        child.stdout.on("data", chunk => {
            if (stdout.length + chunk.length > MAX_OUTPUT_SIZE) {
                outputTooLarge = true;
                child.kill();
                return;
            }
            stdout += chunk;
        });

        child.stderr.on("data", chunk => {
            // Keep only the tail: extractor errors can be very verbose.
            stderr = `${stderr}${chunk}`.slice(-12000);
        });

        child.once("error", error => fail(error));
        child.once("close", code => {
            if (settled) return;
            clearTimeout(timer);

            if (timedOut) {
                fail(new Error(`yt-dlp a dépassé le délai de ${YTDLP_TIMEOUT_MS / 1000} secondes.`));
                return;
            }

            if (outputTooLarge) {
                fail(new Error("yt-dlp a retourné trop de données."));
                return;
            }

            if (code !== 0) {
                const detail = stderr.trim() || stdout.trim() || `yt-dlp a quitté avec le code ${code}.`;
                console.warn(`[Musique] yt-dlp (${code}) : ${sanitizeDiagnostic(detail)}`);
                fail(new Error(detail));
                return;
            }

            try {
                const info = JSON.parse(stdout.trim());
                settled = true;
                resolve(info);
            } catch (error) {
                fail(new Error(`Réponse yt-dlp illisible : ${error.message}`));
            }
        });
    }));
}

async function rejectUnavailableStream(info) {
    let response;

    try {
        response = await fetch(info.url, {
            headers: {
                ...info.http_headers,
                Range: "bytes=0-0"
            },
            signal: AbortSignal.timeout(STREAM_PROBE_TIMEOUT_MS)
        });
    } catch {
        // Network timeouts and transient proxy errors should not make a title
        // unplayable; FFmpeg remains the final authority for those cases.
        return;
    }

    const status = response.status;
    await response.body?.cancel().catch(() => {});

    if ([401, 403, 404, 410, 429].includes(status)) {
        throw new Error(`Le serveur du flux audio a répondu HTTP ${status}.`);
    }
}

function toSong(plugin, info, options) {
    const url = info.webpage_url || info.original_url || info.url;

    if (!url) {
        throw new DisTubeError("YTDLP_PLUGIN_INVALID_SONG", "Le résultat n'a pas de lien source exploitable.");
    }

    return new Song(
        {
            plugin,
            source: info.extractor_key || info.extractor || "yt-dlp",
            playFromSource: true,
            id: String(info.id || url),
            name: info.title || info.fulltitle || "Sans titre",
            url,
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
    constructor() {
        super();
        this.searchCandidates = new WeakMap();
        this.verifiedStreams = new WeakMap();
    }

    validate() {
        return true;
    }

    async resolve(input, options) {
        try {
            const info = await runYtDlp(input);

            if (Array.isArray(info.entries)) {
                const entries = info.entries.filter(entry => entry && (
                    entry.webpage_url || entry.original_url || entry.url
                ));

                if (!entries.length) {
                    throw new Error("La playlist ne contient aucun morceau.");
                }

                return new Playlist(
                    {
                        source: info.extractor_key || info.extractor || "yt-dlp",
                        id: String(info.id || input),
                        name: info.title || "Playlist sans titre",
                        url: info.webpage_url || info.original_url || input,
                        thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
                        songs: entries.slice(0, MAX_PLAYLIST_SIZE).map(entry => toSong(this, entry, options))
                    },
                    options
                );
            }

            return toSong(this, info, options);
        } catch (error) {
            console.warn(`[Musique] Résolution du lien impossible : ${sanitizeDiagnostic(error.message)}`);
            throw new DisTubeError("YTDLP_ERROR", error.message || String(error));
        }
    }

    async searchSong(query, options) {
        const result = await this.resolve(`ytsearch5:${query}`, options);
        const candidates = result instanceof Playlist ? result.songs : [result];

        // Search results can contain unavailable, private, or region-blocked
        // uploads. Try the next candidate instead of failing on the first hit.
        for (let index = 0; index < candidates.length; index += 1) {
            const song = candidates[index];

            try {
                const streamUrl = await this.resolveStreamURL(song);
                this.searchCandidates.set(song, candidates.slice(index));
                this.verifiedStreams.set(song, { url: streamUrl, checkedAt: Date.now() });
                return song;
            } catch (error) {
                // Keep trying the remaining search results.
                console.warn(
                    `[Musique] Résultat ignoré (${sanitizeDiagnostic(song.name)}) : ${sanitizeDiagnostic(error.message)}`
                );
            }
        }

        return null;
    }

    async getStreamURL(song) {
        const alternatives = this.searchCandidates.get(song);
        this.searchCandidates.delete(song);
        const candidates = alternatives?.length ? alternatives : [song];
        let lastError;

        for (const candidate of candidates) {
            try {
                const verified = this.verifiedStreams.get(candidate);
                this.verifiedStreams.delete(candidate);

                if (verified && Date.now() - verified.checkedAt <= VERIFIED_STREAM_MAX_AGE_MS) {
                    return verified.url;
                }

                return await this.resolveStreamURL(candidate);
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new DisTubeError("YTDLP_ERROR", "Aucun flux audio exploitable n'a été trouvé.");
    }

    async resolveStreamURL(song) {
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

            // yt-dlp can resolve a title even when the CDN rejects the actual
            // media URL. Probe one byte so search can skip blocked uploads and
            // continue to another public version before DisTube starts FFmpeg.
            await rejectUnavailableStream(info);

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
