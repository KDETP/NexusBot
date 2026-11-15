const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const STAFF_ROLE_ID = "1457855405370900662";
const MEMBER_ROLE_ID = "1415337484660904088";
const PAGE_SIZE = 1000;

module.exports = {
    name: "membre",

    async execute(message) {
        if (!message.guild || !message.member) return;

        // Autorisation : seul un membre avec ce rôle peut lancer nmembre.
        if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
            return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
        }

        const guild = message.guild;
        const botMember = guild.members.me;

        if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply("❌ Je n'ai pas la permission **Gérer les rôles**.");
        }

        const memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);

        if (!memberRole) {
            return message.reply("❌ Le rôle Membre est introuvable. Vérifie son ID.");
        }

        if (memberRole.position >= botMember.roles.highest.position) {
            return message.reply(
                "❌ Mon rôle le plus élevé doit être placé au-dessus du rôle Membre."
            );
        }

        const statusMessage = await message.reply(
            "⏳ Récupération de la liste des membres du serveur..."
        );

        try {
            // Charge les rôles pour pouvoir vérifier précisément les rôles de chaque membre.
            await guild.roles.fetch();

            // Liste les membres par pages via l'API REST.
            // Cela évite guild.members.fetch(), qui déclenche une requête Gateway opcode 8.
            const allMembers = new Map();
            let after = undefined;

            while (true) {
                const options = { limit: PAGE_SIZE };
                if (after) options.after = after;

                const page = await guild.members.list(options);

                if (page.size === 0) break;

                for (const [id, member] of page) {
                    allMembers.set(id, member);
                }

                if (page.size < PAGE_SIZE) break;

                after = page.last().id;
            }

            // On ne garde que les humains qui n'ont aucun rôle en dehors de @everyone.
            const membersWithoutRoles = [...allMembers.values()].filter(member => {
                if (member.user.bot) return false;
                if (member.id === guild.ownerId) return false;

                const assignedRoles = member.roles.cache.filter(
                    role => role.id !== guild.id
                );

                return assignedRoles.size === 0;
            });

            if (membersWithoutRoles.length === 0) {
                return statusMessage.edit(
                    `✅ Aucun membre sans rôle trouvé. ${allMembers.size} membre(s) ont été vérifiés.`
                );
            }

            let success = 0;
            let failed = 0;

            // Attribution une par une pour limiter les risques de rate limit.
            for (const member of membersWithoutRoles) {
                try {
                    await member.roles.add(
                        MEMBER_ROLE_ID,
                        "Attribution du rôle Membre via la commande nmembre"
                    );
                    success++;
                } catch (error) {
                    failed++;
                    console.error(
                        `Impossible d'attribuer le rôle Membre à ${member.user.tag} (${member.id}) :`,
                        error
                    );
                }
            }

            const embed = new EmbedBuilder()
                .setColor(success > 0 ? 0x57F287 : 0xED4245)
                .setTitle("Régularisation des membres terminée")
                .setDescription(
                    "Seuls les membres sans aucun rôle (à part **@everyone**) ont été ciblés."
                )
                .addFields(
                    {
                        name: "👥 Membres vérifiés",
                        value: `**${allMembers.size}**`,
                        inline: true
                    },
                    {
                        name: "✅ Rôle Membre attribué",
                        value: `**${success}**`,
                        inline: true
                    },
                    {
                        name: "❌ Échecs",
                        value: `**${failed}**`,
                        inline: true
                    }
                )
                .setFooter({ text: `Commande lancée par ${message.author.tag}` })
                .setTimestamp();

            await statusMessage.edit({ content: null, embeds: [embed] });

        } catch (error) {
            console.error("Erreur dans la commande nmembre :", error);

            let errorMessage =
                "❌ Impossible de récupérer la liste complète des membres.";

            if (error.code === 50001 || error.code === 50013) {
                errorMessage +=
                    "\nVérifie les permissions du bot et active l'intent **Server Members Intent** dans le Discord Developer Portal.";
            } else if (typeof guild.members.list !== "function") {
                errorMessage +=
                    "\nTa version de discord.js ne semble pas prendre en charge `guild.members.list()`. Mets discord.js à jour vers une version récente de la branche v14.";
            } else {
                errorMessage += `\nErreur : ${error.message}`;
            }

            await statusMessage.edit(errorMessage).catch(() => {});
        }
    }
};