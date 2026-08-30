const {
    EmbedBuilder
} = require("discord.js");

module.exports = {

    name: "banner",

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

            const userId =
                args[0];

            // Aucun argument → soi-même
            if (!userId) {

                user =
                    message.author;

            } else {

                // Vérification ID Discord
                if (!/^\d{17,20}$/.test(userId)) {
                    return message.reply(
                        "❌ ID Discord invalide."
                    );
                }

                try {

                    user =
                        await message.client.users.fetch(
                            userId,
                            {
                                force: true
                            }
                        );

                } catch (error) {

                    return message.reply(
                        "❌ Impossible de trouver cet utilisateur."
                    );
                }
            }
        }

        // ==========================================
        // BANNIÈRE GLOBALE
        // ==========================================

        const globalUser =
            await message.client.users.fetch(
                user.id,
                {
                    force: true
                }
            );

        const globalBannerURL =
            globalUser.bannerURL({
                size: 4096,
                dynamic: true
            });

        // ==========================================
        // BANNIÈRE DU SERVEUR
        // ==========================================

        let serverBannerURL = null;

        try {

            const guildMember =
                await message.guild.members.fetch(
                    user.id,
                    {
                        force: true
                    }
                );

            serverBannerURL =
                guildMember.bannerURL({
                    size: 4096,
                    dynamic: true
                });

        } catch (error) {

            // L'utilisateur n'est peut-être
            // pas membre de ce serveur.
            serverBannerURL = null;
        }

        // ==========================================
        // AUCUNE BANNIÈRE
        // ==========================================

        if (
            !globalBannerURL &&
            !serverBannerURL
        ) {

            return message.reply(
                `❌ **${user.username}** n'a aucune bannière.`
            );
        }

        // ==========================================
        // EMBEDS
        // ==========================================

        const embeds = [];

        // Bannière globale
        if (globalBannerURL) {

            const globalEmbed =
                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle(
                        `🖼️ Bannière de ${user.username}`
                    )

                    .setDescription(
                        "🌐 **Profil global**"
                    )

                    .setImage(
                        globalBannerURL
                    );

            embeds.push(
                globalEmbed
            );
        }

        // Bannière serveur
        if (serverBannerURL) {

            const serverEmbed =
                new EmbedBuilder()

                    .setColor("#8B5CF6")

                    .setTitle(
                        `🖼️ Bannière de ${user.username}`
                    )

                    .setDescription(
                        `🏠 **Profil de ${message.guild.name}**`
                    )

                    .setImage(
                        serverBannerURL
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