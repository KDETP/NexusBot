const fs = require("fs");
const path = require("path");

const {
    EmbedBuilder
} = require("discord.js");

const giveawaysFile = path.join(
    __dirname,
    "..",
    "data",
    "giveaways.json"
);


// =====================================================
// CHARGER
// =====================================================

function loadGiveaways() {

    if (!fs.existsSync(giveawaysFile)) {
        fs.writeFileSync(
            giveawaysFile,
            "{}",
            "utf8"
        );
    }

    try {
        return JSON.parse(
            fs.readFileSync(
                giveawaysFile,
                "utf8"
            )
        );
    } catch (error) {

        console.error(
            "❌ Erreur lecture giveaways.json :",
            error
        );

        return {};
    }
}


// =====================================================
// SAUVEGARDER
// =====================================================

function saveGiveaways(data) {

    fs.writeFileSync(
        giveawaysFile,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}


// =====================================================
// HANDLER
// =====================================================

module.exports = async (
    client,
    interaction
) => {

    const id =
        interaction.customId;


    // On ne traite que les boutons giveaway
    if (
        !id.startsWith("giveaway_")
    ) {
        return;
    }


    // =================================================
    // ANALYSER LE CUSTOM ID
    // =================================================

    const parts =
        id.split("_");


    const action =
        parts[1];


    const giveawayId =
        parts.slice(2).join("_");


    // =================================================
    // CHARGER
    // =================================================

    const giveaways =
        loadGiveaways();


    const giveaway =
        giveaways[giveawayId];


    // =================================================
    // GIVEAWAY INEXISTANT
    // =================================================

    if (!giveaway) {

        return interaction.reply({

            content:
                "❌ Ce giveaway n'existe plus.",

            ephemeral:
                true

        });

    }


    // =================================================
    // GIVEAWAY TERMINÉ
    // =================================================

    if (
        giveaway.ended
    ) {

        return interaction.reply({

            content:
                "❌ Ce giveaway est terminé.",

            ephemeral:
                true

        });

    }


    // =================================================
    // GIVEAWAY EXPIRÉ
    // =================================================

    if (
        Date.now() >= giveaway.endAt
    ) {

        return interaction.reply({

            content:
                "⏰ Ce giveaway vient de se terminer.",

            ephemeral:
                true

        });

    }


    // =================================================
    // UTILISATEUR
    // =================================================

    const userId =
        interaction.user.id;


    const participants =
        giveaway.participants || [];


    const index =
        participants.indexOf(
            userId
        );


    // =================================================
    // PARTICIPER
    // =================================================

    if (
        action === "join"
    ) {

        if (
            index !== -1
        ) {

            return interaction.reply({

                content:
                    "🎉 Tu participes déjà à ce giveaway !",

                ephemeral:
                    true

            });

        }


        giveaway.participants.push(
            userId
        );


        saveGiveaways(
            giveaways
        );


        await updateGiveawayMessage(
            interaction,
            giveaway
        );


        return interaction.reply({

            content:
                "🎉 Tu participes maintenant au giveaway !",

            ephemeral:
                true

        });

    }


    // =================================================
    // QUITTER
    // =================================================

    if (
        action === "leave"
    ) {

        if (
            index === -1
        ) {

            return interaction.reply({

                content:
                    "❌ Tu ne participes pas à ce giveaway.",

                ephemeral:
                    true

            });

        }


        giveaway.participants.splice(
            index,
            1
        );


        saveGiveaways(
            giveaways
        );


        await updateGiveawayMessage(
            interaction,
            giveaway
        );


        return interaction.reply({

            content:
                "👋 Tu as quitté le giveaway.",

            ephemeral:
                true

        });

    }

};


// =====================================================
// METTRE À JOUR LE COMPTEUR
// =====================================================

async function updateGiveawayMessage(
    interaction,
    giveaway
) {

    try {

        const message =
            await interaction.channel.messages.fetch(
                giveaway.messageId
            );


        if (
            !message.embeds.length
        ) {
            return;
        }


        const oldEmbed =
            message.embeds[0];


        const participantCount =
            giveaway.participants.length;


        let description =
            oldEmbed.description || "";


        description =
            description.replace(
                /👥 \*\*Participants :\*\* \d+/,
                `👥 **Participants :** ${participantCount}`
            );


        const embed =
            EmbedBuilder.from(
                oldEmbed
            )
                .setDescription(
                    description
                );


        await message.edit({

            embeds: [
                embed
            ]

        });


    } catch (error) {

        console.error(
            "❌ Erreur mise à jour giveaway :",
            error.message
        );

    }

}