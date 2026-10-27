const { PermissionFlagsBits } = require("discord.js");

function isSpotifyUrl(query) {
    try {
        const url = new URL(query);
        return /(^|\.)spotify\.com$/i.test(url.hostname) || url.hostname === "spotify.link";
    } catch {
        return false;
    }
}

function isSpotifyTrackUrl(query) {
    try {
        const url = new URL(query);
        return /(^|\.)spotify\.com$/i.test(url.hostname) && /\/track\/[^/]+/i.test(url.pathname);
    } catch {
        return false;
    }
}

async function getSpotifyFallbackTitle(query) {
    const response = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.title === "string" ? data.title.trim() : null;
}

function getSafeErrorDetail(error) {
    return String(error?.message || "Erreur inconnue")
        .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
        .replace(/\s+/g, " ")
        .slice(0, 500);
}

module.exports = {
    // With the existing `n` prefix, this is invoked as `nplay <titre ou lien>`.
    name: "play",

    async execute(message, args) {
        const query = args.join(" ").trim();

        if (!query) {
            return message.reply(
                "🎵 Utilisation : `nplay <titre ou lien YouTube / Spotify / SoundCloud>`"
            );
        }

        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply("🔊 Rejoins d'abord un salon vocal.");
        }

        const botMember = message.guild?.members?.me;
        const permissions = voiceChannel.permissionsFor(botMember);

        if (
            !permissions?.has(PermissionFlagsBits.Connect) ||
            !permissions.has(PermissionFlagsBits.Speak)
        ) {
            return message.reply(
                "❌ Je dois avoir les permissions **Se connecter** et **Parler** dans ce salon vocal."
            );
        }

        const player = message.client.music;

        if (!player) {
            return message.reply(
                "❌ Le lecteur n'est pas encore prêt. Réessaie dans quelques secondes."
            );
        }

        const queue = player.getQueue(message.guildId);

        if (queue?.voiceChannel && queue.voiceChannel.id !== voiceChannel.id) {
            return message.reply(
                "❌ Une lecture est déjà en cours dans un autre salon vocal."
            );
        }

        const playOptions = {
            member: message.member,
            textChannel: message.channel,
            metadata: { channel: message.channel }
        };

        try {
            await player.play(voiceChannel, query, playOptions);
        } catch (error) {
            // Spotify's public oEmbed endpoint can still provide a track title
            // when its metadata plugin is temporarily unavailable. Search that
            // title on YouTube; this does not bypass private or DRM-protected media.
            if (isSpotifyUrl(query) && isSpotifyTrackUrl(query)) {
                try {
                    const fallbackTitle = await getSpotifyFallbackTitle(query);

                    if (fallbackTitle) {
                        await player.play(voiceChannel, fallbackTitle, playOptions);
                        await message.reply(
                            `ℹ️ Le lien Spotify ne répondait pas; j'ai recherché **${fallbackTitle}** sur YouTube.`
                        );
                        return;
                    }
                } catch (fallbackError) {
                    console.error(
                        "Échec de la solution de repli Spotify :",
                        fallbackError?.name || "erreur inconnue"
                    );
                }
            }

            console.error(
                "Impossible d'ajouter le morceau :",
                error?.errorCode || error?.name || "erreur inconnue",
                getSafeErrorDetail(error)
            );
            await message.reply(
                "❌ Je n'ai pas trouvé de version lisible. Vérifie que le contenu est public, puis essaie le titre exact ou un autre lien."
            );
        }
    }
};
