const {
    PermissionsBitField
} = require("discord.js");

// Les laisses actives
const leashes = new Map();

// ======================================================
// REPONSE AUTO-SUPPRIMEE
// ======================================================

async function replyAndDelete(message, content) {
    try {
        const reply = await message.reply(content);

        setTimeout(() => {
            reply.delete().catch(() => {});
            message.delete().catch(() => {});
        }, 5000);

        return reply;
    } catch (error) {
        console.error(
            "❌ Erreur suppression message :",
            error
        );
    }
}

module.exports = {
    name: "chien",

    async execute(message) {

        // ==========================================
        // UNIQUEMENT SUR UN SERVEUR
        // ==========================================

        if (!message.guild) {
            return replyAndDelete(
                message,
                "❌ Cette commande fonctionne uniquement sur un serveur."
            );
        }

        // ==========================================
        // PERMISSION
        // ==========================================

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.ManageGuild
            )
        ) {
            return replyAndDelete(
                message,
                "❌ Tu dois avoir la permission **Gérer le serveur**."
            );
        }

        // ==========================================
        // UTILISATEUR CIBLE
        // Mention OU ID
        // ==========================================

        let target;

        // 1️⃣ Si une personne est mentionnée
        target =
            message.mentions.members.first();

        // 2️⃣ Sinon, on récupère le premier argument
        if (!target) {

            const args =
                message.content
                    .trim()
                    .split(/\s+/)
                    .slice(1);

            const userId =
                args[0];

            if (userId) {

                // Vérifie que ça ressemble bien à un ID Discord
                if (!/^\d{17,20}$/.test(userId)) {
                    return replyAndDelete(
                        message,
                        "❌ ID Discord invalide."
                    );
                }

                try {

                    // Récupère le membre directement
                    // sans créer de mention
                    target =
                        await message.guild.members.fetch(
                            userId
                        );

                } catch (error) {

                    return replyAndDelete(
                        message,
                        "❌ Impossible de trouver cet utilisateur sur ce serveur."
                    );
                }
            }
        }

        // ==========================================
        // AUCUNE CIBLE
        // ==========================================

        if (!target) {
            return replyAndDelete(
                message,
                "🐕 Utilisation : `nchien @utilisateur` ou `nchien ID`"
            );
        }

        // ==========================================
        // BOT
        // ==========================================

        const botMember =
            message.guild.members.me;

        if (
            !botMember.permissions.has(
                PermissionsBitField.Flags.MoveMembers
            )
        ) {
            return replyAndDelete(
                message,
                "❌ Je n'ai pas la permission **Déplacer des membres**."
            );
        }

        // ==========================================
        // IDENTIFIANT DE LA LAISSE
        // ==========================================

        const leashId =
            `${message.guild.id}:${target.id}`;

        // ==========================================
        // SI DEJA ATTACHE -> DETACHE
        // ==========================================

        if (leashes.has(leashId)) {

            clearInterval(
                leashes.get(leashId)
            );

            leashes.delete(leashId);

            return replyAndDelete(
                message,
                `🐕‍🦺 **${target.user.username}** n'est plus attaché.`
            );
        }

        // ==========================================
        // LANCEUR DANS UN VOCAL ?
        // ==========================================

        if (!message.member.voice.channel) {
            return replyAndDelete(
                message,
                "❌ Tu dois être dans un salon vocal pour mettre une laisse."
            );
        }

        // ==========================================
        // CIBLE DANS UN VOCAL ?
        // ==========================================

        if (!target.voice.channel) {
            return replyAndDelete(
                message,
                `❌ **${target.user.username}** n'est pas dans un salon vocal.`
            );
        }

        // ==========================================
        // FONCTION DE SUIVI
        // ==========================================

        const follow = async () => {

            try {

                // Récupère les membres à jour
                const owner =
                    await message.guild.members.fetch(
                        message.author.id
                    );

                const targetMember =
                    await message.guild.members.fetch(
                        target.id
                    );

                // Si le propriétaire quitte le vocal,
                // on ne déplace plus la cible.
                if (!owner.voice.channel) {
                    return;
                }

                // Si la cible est déjà au même endroit
                if (
                    targetMember.voice.channelId ===
                    owner.voice.channelId
                ) {
                    return;
                }

                // Vérifie que le bot peut déplacer la cible
                const bot =
                    message.guild.members.me;

                if (
                    !bot.permissions.has(
                        PermissionsBitField.Flags.MoveMembers
                    )
                ) {
                    return;
                }

                // Déplace la cible
                await targetMember.voice.setChannel(
                    owner.voice.channel
                );

                console.log(
                    `🐕 ${targetMember.user.tag} suit ${owner.user.tag}`
                );

            } catch (error) {

                console.error(
                    "❌ Erreur laisse :",
                    error
                );
            }
        };

        // ==========================================
        // CREATION DE LA LAISSE
        // ==========================================

        const interval =
            setInterval(
                follow,
                1500
            );

        leashes.set(
            leashId,
            interval
        );

        // ==========================================
        // PREMIER FOLLOW IMMEDIAT
        // ==========================================

        await follow();

        // ==========================================
        // MESSAGE DE CONFIRMATION
        // ==========================================

        return replyAndDelete(
            message,
            `🐕 **${target.user.username}** est maintenant ta chienne ♥ !`
        );
    }
};