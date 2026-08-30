const REACTION_ROLES = {

    "👨":
        "1415457997269893261",

    "👩":
        "1415458006149103756",

    "🔞":
        "1415458011136397333",

    "🔰":
        "1415458011832647691"

};


// ==================================================
// REACTION REMOVE
// ==================================================

module.exports = async (
    client,
    reaction,
    user
) => {

    if (user.bot) return;


    // ==================================================
    // PARTIALS
    // ==================================================

    try {

        if (reaction.partial) {

            await reaction.fetch();

        }


        if (reaction.message.partial) {

            await reaction.message.fetch();

        }

    } catch (error) {

        console.error(
            "❌ Erreur récupération réaction :",
            error
        );

        return;

    }


    // ==================================================
    // VÉRIFIER LE MESSAGE N7
    // ==================================================

    const content =
        reaction.message.content || "";


    const embedText =
        reaction.message.embeds
            .map(embed => {

                return [

                    embed.title || "",

                    embed.description || ""

                ].join(" ");

            })
            .join(" ");


    const text =
        `${content} ${embedText}`;


    if (
        !text.includes(
            "Choisis tes rôles"
        )
    ) {

        return;

    }


    // ==================================================
    // TROUVER LE RÔLE
    // ==================================================

    const roleId =
        REACTION_ROLES[
            reaction.emoji.name
        ];


    if (!roleId) return;


    // ==================================================
    // RÉCUPÉRER LE MEMBRE
    // ==================================================

    try {

        const member =
            await reaction.message.guild.members.fetch(
                user.id
            );


        // ==================================================
        // RETIRER LE RÔLE
        // ==================================================

        if (
            member.roles.cache.has(
                roleId
            )
        ) {

            await member.roles.remove(
                roleId,
                "Reaction Role retiré • NebuBot"
            );


            console.log(
                `➖ ${user.tag} perd le rôle ${roleId}`
            );

        }

    } catch (error) {

        console.error(
            "❌ Erreur retrait Reaction Role :",
            error
        );

    }

};