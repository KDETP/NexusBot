const protection =
    require("../services/protection");

const inviteManager =
    require("../services/inviteManager");

const {
    EmbedBuilder
} = require("discord.js");


const joins = [];


// ==========================================
// NOUVEAU MEMBRE
// ==========================================

module.exports = async (
    client,
    member
) => {


    // ======================================
    // ANTI RAID
    // ======================================

    const now =
        Date.now();


    joins.push(now);


    while (
        joins.length &&
        now - joins[0] > 60000
    ) {

        joins.shift();

    }


    if (
        joins.length >= 10 &&
        !protection.panic
    ) {

        protection.enablePanic();


        const general =
            member.guild.channels.cache.get(
                "1532756693878837381"
            );


        if (general) {

            await general.send({

                content:
                    "🚨 **RAID DÉTECTÉ !**\n\nLe mode Panic a été activé automatiquement."

            });

        }


        const logs =
            member.guild.channels.cache.get(
                "1534951215413067876"
            );


        if (logs) {

            await logs.send({

                content:
                    `🚨 AntiRaid : ${joins.length} arrivées en moins d'une minute.`

            });

        }

    }


    // ======================================
    // DETECTION INVITATION
    // ======================================

    let usedInvite = null;


    try {

        usedInvite =
            await inviteManager.getUsedInvite(
                member.guild
            );

    } catch (error) {

        console.error(
            "❌ Erreur détection invitation :",
            error
        );

    }


    // ======================================
    // RECUPERER L'INVITEUR
    // ======================================

    let inviter = null;


    if (
        usedInvite &&
        usedInvite.inviter
    ) {

        inviter =
            usedInvite.inviter;


        // Ajouter +1 invitation
        inviteManager.addInvite(

            member.guild.id,

            inviter.id,

            member.id,

            usedInvite.code

        );

    }


    // ======================================
    // SALON BIENVENUE
    // ======================================

    const welcome =
        member.guild.channels.cache.get(
            "1415335842364260432"
        );


    if (welcome) {

        const members =
            member.guild.members.cache.filter(
                m => !m.user.bot
            ).size;


        const embed =
            new EmbedBuilder()

                .setColor(
                    "#8B5CF6"
                )

                .setTitle(
                    "🌌 Bienvenue sur NebuCommunity !"
                )

                .setThumbnail(

                    member.user.displayAvatarURL({

                        dynamic: true,

                        size: 1024

                    })

                )

                .setDescription(
`
👋 Bienvenue dans la communauté, ${member} !

🎉 Tu es notre **${members}ème membre** !

━━━━━━━━━━━━━━━━━━

📌 **Pour bien commencer**

📖 Lis les règles du serveur

💬 Découvre les salons et discute avec la communauté

🪙 Gagne des **NebuCoins**

🎰 Découvre le **NebuCasino**

━━━━━━━━━━━━━━━━━━

💜 Nous sommes heureux de t'accueillir parmi nous !
`
                )

                .setFooter({

                    text:
                        "NebuBot • Bienvenue"

                })

                .setTimestamp();


        await welcome.send({

            content:
                `${member}`,

            embeds: [
                embed
            ],

            allowedMentions: {

                users: [
                    member.id
                ]

            }

        });

    }


    // ======================================
    // MESSAGE INVITATION
    // ======================================

    const inviteChannel =
        member.guild.channels.cache.get(
            "1415861046350184508"
        );


    if (
        inviteChannel &&
        inviter
    ) {

        const count =
            await inviteManager.getInvites(

                member.guild.id,

                inviter.id

            );


        // ==================================
        // EMBED INVITATION
        // ==================================

        const inviteEmbed =
            new EmbedBuilder()

                .setColor(
                    "#57F287"
                )

                .setTitle(
                    "📨 Nouvelle invitation !"
                )

                .setThumbnail(

                    member.user.displayAvatarURL({

                        dynamic: true,

                        size: 512

                    })

                )

                .setDescription(
`
👤 ${member} vient de rejoindre le serveur !

━━━━━━━━━━━━━━━━━━

🤝 **Invité par**

${inviter}

🎟️ **Invitations de ${inviter.displayName}**

# **${count.toLocaleString("fr-FR")}**

━━━━━━━━━━━━━━━━━━

🎉 Merci de faire grandir **NebuCommunity** ! 💜
`
                )

                .setFooter({

                    text:
                        "NebuBot • Système d'invitations"

                })

                .setTimestamp();


        await inviteChannel.send({

            content:
                `${member} ${inviter}`,

            embeds: [
                inviteEmbed
            ],

            allowedMentions: {

                users: [
                    member.id,
                    inviter.id
                ]

            }

        });

    }

};