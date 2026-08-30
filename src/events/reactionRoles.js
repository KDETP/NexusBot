const ROLE_CONFIG = {

    // ==========================================
    // RÔLES PRINCIPAUX
    // ==========================================

    "👨": "ID_ROLE_HOMME",

    "👩": "ID_ROLE_FEMME",

    "✅": "ID_ROLE_MAJEUR",

    "🔞": "ID_ROLE_MINEUR",


    // ==========================================
    // DIVERS
    // ==========================================

    "🎌": "ID_ROLE_MANGA",

    "🎮": "ID_ROLE_GAMER"

};


// ==========================================
// AJOUT / RETRAIT DES RÔLES
// ==========================================

async function handleReaction(
    reaction,
    user,
    addRole
) {

    if (user.bot) return;


    // ======================================
    // PARTIAL REACTION
    // ======================================

    try {

        if (reaction.partial) {

            await reaction.fetch();

        }

    } catch (error) {

        console.error(
            "❌ Impossible de récupérer la réaction :",
            error
        );

        return;

    }


    // ======================================
    // EMOJI
    // ======================================

    const emoji =
        reaction.emoji.name;


    const roleId =
        ROLE_CONFIG[emoji];


    if (!roleId) return;


    // ======================================
    // MEMBRE
    // ======================================

    let member;

    try {

        member =
            await reaction.message.guild.members.fetch(
                user.id
            );

    } catch {

        return;

    }


    // ======================================
    // RÔLE
    // ======================================

    const role =
        reaction.message.guild.roles.cache.get(
            roleId
        );


    if (!role) {

        console.error(
            `❌ Rôle introuvable : ${roleId}`
        );

        return;

    }


    // ======================================
    // AJOUTER
    // ======================================

    if (addRole) {

        if (!member.roles.cache.has(role.id)) {

            try {

                await member.roles.add(
                    role,
                    "Reaction Role • NebuBot"
                );

                console.log(
                    `➕ ${user.tag} reçoit le rôle ${role.name}`
                );

            } catch (error) {

                console.error(
                    "❌ Impossible d'ajouter le rôle :",
                    error
                );

            }

        }

    }


    // ======================================
    // RETIRER
    // ======================================

    else {

        if (member.roles.cache.has(role.id)) {

            try {

                await member.roles.remove(
                    role,
                    "Reaction Role • NebuBot"
                );

                console.log(
                    `➖ ${user.tag} perd le rôle ${role.name}`
                );

            } catch (error) {

                console.error(
                    "❌ Impossible de retirer le rôle :",
                    error
                );

            }

        }

    }

}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    add: async (
        client,
        reaction,
        user
    ) => {

        await handleReaction(
            reaction,
            user,
            true
        );

    },


    remove: async (
        client,
        reaction,
        user
    ) => {

        await handleReaction(
            reaction,
            user,
            false
        );

    }

};