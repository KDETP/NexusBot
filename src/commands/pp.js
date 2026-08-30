const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "pp",

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

                // Vérification de l'ID Discord
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
        // PROFIL GLOBAL
        // ==========================================

        const globalUser =
            await message.client.users.fetch(
                user.id,
                {
                    force: true
                }
            );

        const globalAvatarURL =
            globalUser.displayAvatarURL({
                size: 4096,
                dynamic: true
            });

        // ==========================================
        // PROFIL DU SERVEUR
        // ==========================================

        let serverAvatarURL = null;

        try {

            const member =
                await message.guild.members.fetch(
                    user.id,
                    {
                        force: true
                    }
                );

            // Avatar spécifiquement configuré
            // sur ce serveur
            if (member.avatar) {

                serverAvatarURL =
                    member.avatarURL({
                        size: 4096,
                        dynamic: true
                    });
            }

        } catch (error) {

            // L'utilisateur n'est pas membre
            // du serveur
            serverAvatarURL = null;
        }

        // ==========================================
        // EMBEDS
        // ==========================================

        const embeds = [];

        // ==========================================
        // PP GLOBALE
        // ==========================================

        if (globalAvatarURL) {

            const globalEmbed =
                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle(
                        `🖼️ Photo de ${user.username}`
                    )

                    .setDescription(
                        "🌐 **Profil global**"
                    )

                    .setImage(
                        globalAvatarURL
                    );

            embeds.push(
                globalEmbed
            );
        }

        // ==========================================
        // PP SERVEUR
        // ==========================================

        if (
            serverAvatarURL &&
            serverAvatarURL !== globalAvatarURL
        ) {

            const serverEmbed =
                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle(
                        `🖼️ Photo de ${user.username}`
                    )

                    .setDescription(
                        `🏠 **Profil de ${message.guild.name}**`
                    )

                    .setImage(
                        serverAvatarURL
                    );

            embeds.push(
                serverEmbed
            );
        }

        // ==========================================
        // ENVOI
        // ==========================================

        await message.reply({
            embeds
        });
    }
};