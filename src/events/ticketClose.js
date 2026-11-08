const {
    EmbedBuilder
} = require("discord.js");

const discordTranscripts =
    require("discord-html-transcripts");

const logsChannel =
    "1534951215413067876";


module.exports = async (
    client,
    interaction
) => {

    // ==========================================
    // VÉRIFICATION
    // ==========================================

    if (!interaction.isButton()) {

        return;

    }


    if (
        interaction.customId !==
        "close_ticket"
    ) {

        return;

    }


    console.log(
        "🔒 Fermeture ticket demandée par :",
        interaction.user.tag
    );


    // ==========================================
    // RÉPONDRE À DISCORD IMMÉDIATEMENT
    // ==========================================

    try {

        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            await interaction.deferReply({
                ephemeral: true
            });

        }

    } catch (error) {

        console.error(
            "❌ Impossible de répondre à l'interaction :",
            error
        );

        // On ne fait surtout pas planter le bot
        return;

    }


    let transcript = null;


    try {

        // ======================================
        // TRANSCRIPT
        // ======================================

        try {

            transcript =
                await discordTranscripts.createTranscript(

                    interaction.channel,

                    {

                        limit: -1,

                        filename:
                            `${interaction.channel.name}.html`

                    }

                );

            console.log(
                "📄 Transcript créé."
            );


        } catch (error) {

            console.error(
                "❌ Erreur transcript :",
                error
            );

        }


        // ======================================
        // LOGS
        // ======================================

        const logs =
            interaction.guild.channels.cache.get(
                logsChannel
            );


        if (logs) {

            const embed =
                new EmbedBuilder()

                    .setColor(
                        "#ED4245"
                    )

                    .setTitle(
                        "🔒 Ticket fermé"
                    )

                    .setDescription(
`
📂 **Ticket :**

${interaction.channel.name}

👤 **Fermé par :**

${interaction.user}

🆔 **ID :**

\`${interaction.user.id}\`

📅 **Date :**

<t:${Math.floor(Date.now() / 1000)}:F>
`
                    )

                    .setFooter({

                        text:
                            "Nebulae • Tickets"

                    })


            await logs.send({

                embeds: [
                    embed
                ],

                files:
                    transcript
                        ? [transcript]
                        : []

            });


            console.log(
                "📨 Ticket enregistré dans les logs."
            );

        }


        // ======================================
        // CONFIRMATION
        // ======================================

        try {

            if (
                interaction.deferred ||
                interaction.replied
            ) {

                await interaction.editReply({

                    content:
                        "🔒 Ticket fermé. Suppression du salon dans 3 secondes..."

                });

            }

        } catch (error) {

            console.error(
                "⚠️ Impossible d'envoyer la confirmation :",
                error.message
            );

        }


        // ======================================
        // SUPPRESSION
        // ======================================

        setTimeout(
            async () => {

                try {

                    if (
                        interaction.channel
                    ) {

                        await interaction.channel.delete(
                            "Ticket fermé"
                        );

                    }


                } catch (error) {

                    console.error(
                        "❌ Erreur suppression salon :",
                        error
                    );

                }

            },

            3000

        );


    } catch (error) {

        console.error(
            "❌ Erreur fermeture ticket :",
            error
        );


        // ======================================
        // MESSAGE D'ERREUR
        // ======================================

        try {

            if (
                interaction.deferred ||
                interaction.replied
            ) {

                await interaction.editReply({

                    content:
                        "❌ Une erreur est survenue pendant la fermeture du ticket."

                });

            }

        } catch {}

    }

};