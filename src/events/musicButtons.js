const {
    pauseMusic,
    resumeMusic,
    skipMusic,
    stopMusic,
    toggleLoop
} = require("../services/musicPlayer");


module.exports = async (
    client,
    interaction
) => {

    if (!interaction.isButton()) {
        return;
    }


    // ==========================================
    // VÉRIFIER SI C'EST UN BOUTON MUSIQUE
    // ==========================================

    if (
        !interaction.customId.startsWith(
            "music_"
        )
    ) {

        return;

    }


    // ==========================================
    // VÉRIFIER LE VOCAL
    // ==========================================

    const member =
        interaction.member;


    const voiceChannel =
        member.voice.channel;


    if (!voiceChannel) {

        return interaction.reply({

            content:
                "❌ Tu dois être dans un salon vocal pour contrôler la musique.",

            ephemeral: true

        });

    }


    // ==========================================
    // LE BOT DOIT ÊTRE DANS LE MÊME VOCAL
    // ==========================================

    const botVoice =
        interaction.guild.members.me
            ?.voice.channel;


    if (
        !botVoice ||
        botVoice.id !== voiceChannel.id
    ) {

        return interaction.reply({

            content:
                "❌ Tu dois être dans le même salon vocal que NebuMusic.",

            ephemeral: true

        });

    }


    // ==========================================
    // PAUSE
    // ==========================================

    if (
        interaction.customId ===
        "music_pause"
    ) {

        const success =
            pauseMusic(
                interaction.guild.id
            );


        return interaction.reply({

            content:
                success
                    ? "⏸️ Musique mise en pause."
                    : "❌ Impossible de mettre la musique en pause.",

            ephemeral: true

        });

    }


    // ==========================================
    // REPRENDRE
    // ==========================================

    if (
        interaction.customId ===
        "music_resume"
    ) {

        const success =
            resumeMusic(
                interaction.guild.id
            );


        return interaction.reply({

            content:
                success
                    ? "▶️ Musique reprise."
                    : "❌ Impossible de reprendre la musique.",

            ephemeral: true

        });

    }


    // ==========================================
    // SKIP
    // ==========================================

    if (
        interaction.customId ===
        "music_skip"
    ) {

        const success =
            skipMusic(
                interaction.guild.id
            );


        return interaction.reply({

            content:
                success
                    ? "⏭️ Musique suivante."
                    : "❌ Aucune musique à passer.",

            ephemeral: true

        });

    }


    // ==========================================
    // LOOP
    // ==========================================

    if (
        interaction.customId ===
        "music_loop"
    ) {

        const enabled =
            toggleLoop(
                interaction.guild.id
            );


        if (enabled === false) {

            return interaction.reply({

                content:
                    "❌ Aucune musique en cours.",

                ephemeral: true

            });

        }


        return interaction.reply({

            content:
                enabled
                    ? "🔁 Répétition activée."
                    : "➡️ Répétition désactivée.",

            ephemeral: true

        });

    }


    // ==========================================
    // STOP
    // ==========================================

    if (
        interaction.customId ===
        "music_stop"
    ) {

        const success =
            stopMusic(
                interaction.guild.id
            );


        return interaction.reply({

            content:
                success
                    ? "⏹️ Musique arrêtée et file vidée."
                    : "❌ Aucune musique en cours.",

            ephemeral: true

        });

    }

};