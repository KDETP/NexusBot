const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createImage
} = require("../utils/imageTools");


module.exports = {

    name: "implode",

    async execute(message) {

        // ==========================================
        // UTILISATEUR CIBLE
        // Mention OU ID
        // ==========================================

        let user =
            message.mentions.users.first();

        if (!user) {

            const args =
                message.content
                    .trim()
                    .split(/\s+/)
                    .slice(1);

            const input =
                args[0];

            // Aucun argument → soi-même
            if (!input) {

                user =
                    message.author;

            } else {

                // Vérification ID Discord
                if (!/^\d{17,20}$/.test(input)) {
                    return message.reply(
                        "❌ ID Discord invalide."
                    );
                }

                try {

                    user =
                        await message.client.users.fetch(
                            input,
                            {
                                force: true
                            }
                        );

                } catch (error) {

                    return message.reply(
                        "❌ Impossible de trouver cet utilisateur. Vérifie que l'ID Discord est correct."
                    );
                }
            }
        }

        // ==========================================
        // CRÉATION DE L'IMAGE
        // ==========================================

        const image =
            await createImage(
                "implode",
                user
            );

        // ==========================================
        // FICHIER
        // ==========================================

        const file =
            new AttachmentBuilder(
                image,
                {
                    name: "implode.png"
                }
            );

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor("#8B5CF6")

                .setTitle(
                    "🌀 Nebu Implode"
                )

                .setImage(
                    "attachment://implode.png"
                );

        // ==========================================
        // ENVOI
        // ==========================================

        await message.reply({

            embeds: [
                embed
            ],

            files: [
                file
            ]

        });
    }
};