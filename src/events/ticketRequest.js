const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


// ==========================================
// CATÉGORIE DES TICKETS
// ==========================================

const ticketCategory =
    "1535332776566460426";


// ==========================================
// RÔLES STAFF
// ==========================================

const staffRoles = [

    "1457855405370900662", // 👑 Couronne
    "1452142914099478630", // •
    "1415339765657764002", // 🛡️ Staff basic
    "1415339840198938664", // 👑 Admin
    "1415339900445786183"  // 🛡️ Responsable Staff

];


// ==========================================
// ANTI DOUBLE ACCEPTATION
// ==========================================

const processingTickets =
    new Set();


module.exports = async (
    client,
    interaction
) => {


    // ==========================================
    // VÉRIFICATION BOUTON
    // ==========================================

    if (
        !interaction.isButton()
    ) {

        return;

    }


    // ==========================================
    // REFUSER
    // ==========================================

    if (
        interaction.customId ===
        "deny_ticket"
    ) {

        return;

    }


    // ==========================================
    // ACCEPTER
    // ==========================================

    if (
        interaction.customId !==
        "accept_ticket"
    ) {

        return;

    }


    // ==========================================
    // RÉPONDRE IMMÉDIATEMENT À DISCORD
    // ==========================================

    await interaction.deferReply({
        ephemeral: true
    });


    const ticketId =
        interaction.message.id;


    // ==========================================
    // ANTI DOUBLE ACCEPTATION
    // ==========================================

    if (
        processingTickets.has(
            ticketId
        )
    ) {

        return interaction.editReply(
            "⚠️ Cette demande est déjà en cours de traitement."
        );

    }


    processingTickets.add(
        ticketId
    );


    try {


        // ======================================
        // PERMISSION STAFF
        // ======================================

        const isStaff =
            interaction.member.roles.cache.some(
                role =>
                    staffRoles.includes(
                        role.id
                    )
            );


        if (!isStaff) {

            return interaction.editReply(
                "❌ Tu n'as pas la permission d'accepter un ticket."
            );

        }


        // ======================================
        // MESSAGE ORIGINAL
        // ======================================

        const message =
            interaction.message;


        const embed =
            message.embeds[0];


        if (!embed) {

            return interaction.editReply(
                "❌ Impossible de trouver les informations du ticket."
            );

        }


        const description =
            embed.description || "";


        // ======================================
        // TROUVER LE CRÉATEUR
        // ======================================

        const userId =
            description.match(
                /<@!?(\d+)>/
            );


        if (!userId) {

            return interaction.editReply(
                "❌ Impossible de trouver le créateur du ticket."
            );

        }


        // ======================================
        // RÉCUPÉRER LE MEMBRE
        // ======================================

        const member =
            await interaction.guild.members.fetch(
                userId[1]
            );


        // ======================================
        // EMPÊCHER LE CRÉATEUR D'ACCEPTER
        // ======================================

        if (
            member.id ===
            interaction.user.id
        ) {

            return interaction.editReply(
                "❌ Tu ne peux pas accepter ton propre ticket."
            );

        }


        // ======================================
        // CATÉGORIE
        // ======================================

        let categoryName =
            "support";


        if (
            description.includes(
                "Signalement"
            )
        ) {

            categoryName =
                "signalement";

        }


        if (
            description.includes(
                "Partenariat"
            )
        ) {

            categoryName =
                "partenariat";

        }


        if (
            description.includes(
                "Question"
            )
        ) {

            categoryName =
                "question";

        }


        const emojis = {

            support:
                "🛠️",

            signalement:
                "🚨",

            partenariat:
                "🤝",

            question:
                "❓"

        };


        // ======================================
        // RÉCUPÉRATION DE LA CATÉGORIE
        // ======================================

        const category =
            await interaction.guild.channels
                .fetch(ticketCategory)
                .catch(() => null);


        if (!category) {

            return interaction.editReply(
                "❌ La catégorie des tickets est introuvable."
            );

        }


        if (
            category.type !==
            ChannelType.GuildCategory
        ) {

            return interaction.editReply(
                "❌ L'ID configuré pour la catégorie des tickets n'est pas une catégorie."
            );

        }


        // ======================================
        // RÉCUPÉRATION DES RÔLES STAFF
        // ======================================

        const validStaffRoles = [];


        for (
            const roleId of staffRoles
        ) {

            const role =
                await interaction.guild.roles
                    .fetch(roleId)
                    .catch(() => null);


            if (role) {

                validStaffRoles.push(
                    role
                );

            } else {

                console.warn(
                    `⚠️ Rôle staff introuvable : ${roleId}`
                );

            }

        }


        // ======================================
        // CRÉATION DU SALON
        // ======================================

        const channel =
            await interaction.guild.channels.create({

                name:
                    `${emojis[categoryName]}-${categoryName}-${interaction.user.username}`
                        .toLowerCase(),

                type:
                    ChannelType.GuildText,

                parent:
                    category,

                topic:
                    `Demandeur:${member.id} | Staff:${interaction.user.id}`,

                permissionOverwrites: [

                    // ==================================
                    // @EVERYONE
                    // ==================================

                    {

                        id:
                            interaction.guild.roles.everyone,

                        deny: [

                            PermissionFlagsBits.ViewChannel

                        ]

                    },


                    // ==================================
                    // CRÉATEUR DU TICKET
                    // ==================================

                    {

                        id:
                            member,

                        allow: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages

                        ]

                    },


                    // ==================================
                    // STAFF QUI ACCEPTE
                    // ==================================

                    {

                        id:
                            interaction.member,

                        allow: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages

                        ]

                    },


                    // ==================================
                    // RÔLES STAFF
                    // ==================================

                    ...validStaffRoles.map(
                        role => ({

                            id:
                                role,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages

                            ]

                        })
                    )

                ]

            });


        // ======================================
        // BOUTON FERMER
        // ======================================

        const closeButton =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            "close_ticket"
                        )

                        .setLabel(
                            "🔒 Fermer le ticket"
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )

                );


        // ======================================
        // EMBED DU TICKET
        // ======================================

        const ticketEmbed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🎫 Ticket ouvert"
                )

                .setDescription(
`
👤 **Demandeur :**

${member}

🛠️ **Pris en charge par :**

${interaction.user}

📂 **Catégorie :**

${categoryName}
`
                )

                .setFooter({

                    text:
                        "Nebulae • Tickets"

                })

                .setTimestamp();


        // ======================================
        // MESSAGE DANS LE TICKET
        // ======================================

        await channel.send({

            content:
                `${member} ${interaction.user}`,

            embeds: [
                ticketEmbed
            ],

            components: [
                closeButton
            ]

        });


        // ======================================
        // MODIFIER LA DEMANDE
        // ======================================

        await message.edit({

            content:
                `✅ Demande acceptée par ${interaction.user}`,

            embeds: [],

            components: []

        });


        // ======================================
        // SUPPRIMER L'ANCIENNE DEMANDE
        // ======================================

        setTimeout(() => {

            message
                .delete()
                .catch(() => {});

        }, 3000);


        // ======================================
        // RÉPONSE À L'INTERACTION
        // ======================================

        await interaction.editReply({

            content:
                `✅ Ticket créé : ${channel}`

        });


    } catch (error) {

        console.error(
            "❌ Erreur création ticket :",
            error
        );


        // ======================================
        // SI UNE ERREUR ARRIVE
        // ======================================

        try {

            await interaction.editReply({

                content:
                    "❌ Une erreur est survenue lors de la création du ticket."

            });

        } catch {}

    } finally {

        processingTickets.delete(
            ticketId
        );

    }

};