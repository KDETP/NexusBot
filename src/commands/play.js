const { PermissionFlagsBits } = require("discord.js");

function isSpotifyUrl(query) {
    return /(?:open\.)?spotify\.com\//i.test(query);
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

        if (
            isSpotifyUrl(query) &&
            (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)
        ) {
            await message.reply(
                "ℹ️ Je vais essayer de résoudre ce lien Spotify. Pour une compatibilité Spotify fiable, ajoute `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` dans le fichier `.env` du bot."
            );
        }

        try {
            await player.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                metadata: { channel: message.channel }
            });
        } catch (error) {
            console.error("Impossible d'ajouter le morceau :", error.message);
            await message.reply(
                "❌ Je n'ai pas trouvé de version lisible de ce morceau. Essaie un autre lien ou le titre exact."
            );
        }
    }
};
