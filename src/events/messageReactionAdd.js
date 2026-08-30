const {
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");


// ==================================================
// RÔLE RÈGLEMENT
// ==================================================

const roleReglement =
    "1415337484660904088";


// ==================================================
// RÔLES RÉACTION
// ==================================================

const REACTION_ROLES = {

    "👨":
        "1415457997269893261",

    "👩":
        "1415458006149103756",

    "🔞":
        "1415458011136397333",

    "🔰":
        "1415458011832647691",

    "🎮":
        "1415870444023578694"

};


// ==================================================
// RECONNAÎTRE LE MESSAGE DE RÔLES
// ==================================================

function isRoleMessage(message) {

    if (!message) return false;


    const content =
        message.content || "";


    const embedText =
        message.embeds
            .map(embed => {

                return [

                    embed.title || "",

                    embed.description || ""

                ].join(" ");

            })
            .join(" ");


    const text =
        `${content} ${embedText}`;


    return (
        text.includes(
            "Choisis tes rôles"
        )
    );

}


// ==================================================
// REACTION ADD
// ==================================================

module.exports = async (
    client,
    reaction,
    user
) => {


    console.log(
        "🔥 REACTION RECUE :",
        reaction.emoji.name,
        user.tag
    );


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
    // RÈGLEMENT 📜
    // ==================================================

    if (
        reaction.emoji.name === "📜"
    ) {

        try {

            const member =
                await reaction.message.guild.members.fetch(
                    user.id
                );


            if (
                !member.roles.cache.has(
                    roleReglement
                )
            ) {

                await member.roles.add(
                    roleReglement
                );


                console.log(
                    "✅ Rôle règlement donné à",
                    user.tag
                );

            }

        } catch (error) {

            console.error(
                "❌ Erreur rôle règlement :",
                error
            );

        }


        return;

    }


    // ==================================================
    // RÔLES PRINCIPAUX
    // ==================================================

    if (
        isRoleMessage(
            reaction.message
        )
    ) {

        const emoji =
            reaction.emoji.name;


        const roleId =
            REACTION_ROLES[emoji];


        if (!roleId) {

            return;

        }


        try {

            const member =
                await reaction.message.guild.members.fetch(
                    user.id
                );


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


            // ==========================================
            // AJOUT DU RÔLE
            // ==========================================

            if (
                !member.roles.cache.has(
                    role.id
                )
            ) {

                await member.roles.add(
                    role,
                    "Reaction Role • NebuBot"
                );


                console.log(
                    `✅ ${user.tag} reçoit le rôle ${role.name}`
                );

            }


        } catch (error) {

            console.error(
                "❌ Erreur Reaction Role :",
                error
            );

        }


        return;

    }


    // ==================================================
    // TICKET 🎫
    // ==================================================

    if (
        reaction.emoji.name !== "🎫"
    ) {

        return;

    }


    if (
        reaction.message.channel.id !==
        "1415764652679495710"
    ) {

        return;

    }


    const menu =
        new ActionRowBuilder()

            .addComponents(

                new StringSelectMenuBuilder()

                    .setCustomId(
                        "ticket_category"
                    )

                    .setPlaceholder(
                        "Choisis le type de ticket"
                    )

                    .addOptions([

                        {

                            label:
                                "Support",

                            description:
                                "Besoin d'aide",

                            value:
                                "support",

                            emoji:
                                "🛠️"

                        },

                        {

                            label:
                                "Signalement",

                            description:
                                "Signaler un membre",

                            value:
                                "signalement",

                            emoji:
                                "🚨"

                        },

                        {

                            label:
                                "Partenariat",

                            description:
                                "Proposition",

                            value:
                                "partenariat",

                            emoji:
                                "🤝"

                        },

                        {

                            label:
                                "Question",

                            description:
                                "Une question",

                            value:
                                "question",

                            emoji:
                                "❓"

                        }

                    ])

            );


    try {

        await reaction.users.remove(
            user.id
        );


        await user.send({

            content:
                "🎫 **NebuTicket**\n\nChoisis la catégorie de ton ticket :",

            components: [
                menu
            ]

        });


    } catch (error) {

        console.error(
            "❌ Erreur ticket réaction :",
            error
        );

    }

};