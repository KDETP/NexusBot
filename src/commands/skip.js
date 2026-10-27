module.exports = {
    // With the existing `n` prefix, this is invoked as `nskip`.
    name: "skip",

    async execute(message) {
        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply("🔊 Rejoins le salon vocal où la musique est en cours pour utiliser `nskip`.");
        }

        const player = message.client.music;
        const queue = player?.getQueue(message.guildId);

        if (!queue?.songs?.length) {
            return message.reply("ℹ️ Il n'y a aucune musique en cours à passer.");
        }

        if (queue.voiceChannel?.id !== voiceChannel.id) {
            return message.reply("❌ Tu dois être dans le même salon vocal que le bot pour passer la musique.");
        }

        const currentSong = queue.songs[0];

        try {
            if (queue.songs.length === 1) {
                await queue.stop();
                return message.reply(`⏭️ **${currentSong.name}** a été passée. La file est vide, j'ai arrêté la lecture.`);
            }

            const nextSong = await queue.skip();
            return message.reply(`⏭️ Morceau passé. Lecture de **${nextSong.name}**.`);
        } catch (error) {
            console.error("Impossible de passer le morceau :", error?.errorCode || error?.name || "erreur inconnue");
            return message.reply("❌ Je n'ai pas pu passer ce morceau. Essaie à nouveau dans quelques secondes.");
        }
    }
};
