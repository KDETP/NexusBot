const {
    PermissionsBitField
} = require("discord.js");

// ======================================================
// CONFIGURATION
// ======================================================

const CROWN_ROLE_ID =
    "1457855405370900662";

// Protections actives
const protectedUsers = new Map();

// ======================================================
// COMMANDE
// ======================================================

module.exports = {

    name: "protect",

    async execute(message) {

        // ==================================================
        // SERVEUR UNIQUEMENT
        // ==================================================

        if (!message.guild) {
            return message.reply(
                "❌ Cette commande fonctionne uniquement sur un serveur."
            );
        }

        // ==================================================
        // VERIFICATION ROLE COURONNE
        // ==================================================

        if (
            !message.member.roles.cache.has(
                CROWN_ROLE_ID
            )
        ) {
            return message.reply(
                "👑 **Accès refusé.** Seuls les membres **Couronne** peuvent utiliser cette commande."
            );
        }

        // ==================================================
        // VERIFICATION PERMISSION DU BOT
        // ==================================================

        const botMember =
            message.guild.members.me;

        if (!botMember) {
            return message.reply(
                "❌ Impossible de récupérer mon profil serveur."
            );
        }

        if (
            !botMember.permissions.has(
                PermissionsBitField.Flags.ManageNicknames
            )
        ) {
            return message.reply(
                "❌ Je n'ai pas la permission **Gérer les pseudos**."
            );
        }

        // ==================================================
        // UTILISATEUR CIBLE
        // ==================================================

        const target =
            message.mentions.members.first();

        if (!target) {
            return message.reply(
                "🛡️ Utilisation : `nprotect @utilisateur`"
            );
        }

        // ==================================================
        // NE PAS PROTEGER LE BOT
        // ==================================================

        if (target.user.bot) {
            return message.reply(
                "❌ Tu ne peux pas protéger un bot."
            );
        }

        // ==================================================
        // IDENTIFIANT UNIQUE
        // ==================================================

        const protectionId =
            `${message.guild.id}:${target.id}`;

        // ==================================================
        // DEJA PROTEGE -> RETIRER
        // ==================================================

        if (
            protectedUsers.has(
                protectionId
            )
        ) {

            const oldNickname =
                protectedUsers.get(
                    protectionId
                );

            try {

                await target.setNickname(
                    oldNickname || null,
                    `Fin de protection par ${message.author.tag}`
                );

                protectedUsers.delete(
                    protectionId
                );

                return message.reply(
                    `🛡️ La protection de **${target.user.username}** a été retirée.`
                );

            } catch (error) {

                console.error(
                    "❌ Erreur retrait protection :",
                    error
                );

                return message.reply(
                    "❌ Impossible de retirer la protection."
                );
            }
        }

        // ==================================================
        // VERIFICATION HIERARCHIE
        // ==================================================

        if (
            target.roles.highest.position >=
            botMember.roles.highest.position
        ) {
            return message.reply(
                "❌ Je ne peux pas modifier le pseudo de cette personne : son rôle est supérieur ou égal à mon rôle."
            );
        }

        // ==================================================
        // SAUVEGARDE DE L'ANCIEN PSEUDO
        // ==================================================

        const oldNickname =
            target.nickname;

        protectedUsers.set(
            protectionId,
            oldNickname
        );

        // ==================================================
        // NOM DU PROTECTEUR
        // ==================================================

        const protectorName =
            message.member.displayName ||
            message.author.username;

        // ==================================================
        // NOUVEAU PSEUDO
        // ==================================================

        let protectedNickname =
            `𓆩 Protégé de ${protectorName} 𓆪`;

        // Discord limite le pseudo à 32 caractères
        if (
            protectedNickname.length > 32
        ) {
            protectedNickname =
                protectedNickname.substring(
                    0,
                    32
                );
        }

        // ==================================================
        // MODIFICATION DU PSEUDO
        // ==================================================

        try {

            await target.setNickname(
                protectedNickname,
                `Protection par ${message.author.tag}`
            );

            const reply =
                await message.reply(
                    `🛡️ **${target.user.username}** est maintenant protégé par **${protectorName}**.\n\n` +
                    `👑 Protection activée\n` +
                    `✦ Pseudo : **${protectedNickname}**`
                );

            // Suppression automatique après 5 secondes
            setTimeout(() => {

                reply.delete()
                    .catch(() => {});

                message.delete()
                    .catch(() => {});

            }, 5000);

            return reply;

        } catch (error) {

            protectedUsers.delete(
                protectionId
            );

            console.error(
                "❌ Erreur protection :",
                error
            );

            return message.reply(
                "❌ Impossible de modifier le pseudo de cette personne."
            );
        }
    }
};