const {
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

const inviteManager =
    require("../services/inviteManager");


// ==========================================
// MEMBRE QUITTE / EST BANNI
// ==========================================

module.exports = async (
    client,
    member
) => {

    console.log(
        "🚪 DEPART DETECTE :",
        member.user.tag
    );


    // ==========================================
    // RETIRER L'INVITATION
    // ==========================================

    try {

        const inviterId =
            await inviteManager.removeInvite(

                member.guild.id,

                member.id

            );


        if (
            inviterId
        ) {

            console.log(
                `📤 Invitation retirée : ${member.user.tag} → ${inviterId}`
            );

        }

    } catch (error) {

        console.error(
            "❌ Erreur retrait invitation :",
            error
        );

    }


    // ==========================================
    // VERIFIER SI C'EST UN BAN
    // ==========================================

    let isBanned = false;


    try {

        await member.guild.bans.fetch(
            member.id
        );


        isBanned = true;

    } catch {

        isBanned = false;

    }


    // ==========================================
    // SI BAN
    // ==========================================

    if (
        isBanned
    ) {

        console.log(
            "🔨 BAN DETECTE :",
            member.user.tag
        );


        // ======================================
        // SALON DES BANS
        // ======================================

        const banChannel =
            member.guild.channels.cache.get(
                "1415457668071555133"
            );


        if (!banChannel) {

            console.log(
                "❌ Salon des bans introuvable."
            );

            return;

        }


        // ======================================
        // RECUPERER LE MODERATEUR
        // ======================================

        let executor = null;
        let reason = null;


        try {

            const auditLogs =
                await member.guild.fetchAuditLogs({

                    type:
                        AuditLogEvent.MemberBanAdd,

                    limit:
                        10

                });


            const banEntry =
                auditLogs.entries.find(

                    entry =>

                        entry.target &&
                        entry.target.id ===
                            member.id &&

                        Date.now() -
                            entry.createdTimestamp <
                            15000

                );


            if (
                banEntry
            ) {

                executor =
                    banEntry.executor;

                reason =
                    banEntry.reason;

            }

        } catch (error) {

            console.error(
                "❌ Impossible de récupérer les Audit Logs :",
                error
            );

        }


        // ======================================
        // VALEURS PAR DEFAUT
        // ======================================

        const executorText =
            executor
                ? `${executor}`
                : "Inconnu";


        const reasonText =
            reason ||
            "Aucune raison indiquée";


        // ======================================
        // DUREE
        // ======================================
        //
        // Discord ne fournit pas la durée
        // d'un ban classique dans l'event.
        //
        // Donc un ban Discord classique
        // est considéré comme permanent.
        //
        // Si ton système de tempban possède
        // une base de données, on pourra ensuite
        // afficher la vraie durée.
        //

        const durationText =
            "🔒 Permanente";


        // ======================================
        // EMBED BAN
        // ======================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#ED4245"
                )

                .setTitle(
                    "🔨 Membre banni"
                )

                .setThumbnail(

                    member.user.displayAvatarURL({

                        dynamic: true,

                        size: 1024

                    })

                )

                .setDescription(
`
👤 **Membre**

${member}

━━━━━━━━━━━━━━━━━━

🛡️ **Banni par**

${executorText}

📝 **Raison**

\`${reasonText}\`

⏱️ **Durée**

${durationText}

━━━━━━━━━━━━━━━━━━

🆔 **ID**

\`${member.id}\`
`
                )

                .setFooter({

                    text:
                        "NebuBot • Modération"

                })


        // ======================================
        // ENVOYER LE LOG
        // ======================================

        try {

            await banChannel.send({

                embeds: [
                    embed
                ]

            });


            console.log(
                "✅ Log de ban envoyé pour",
                member.user.tag
            );


        } catch (error) {

            console.error(
                "❌ Erreur envoi log ban :",
                error
            );

        }


        // ======================================
        // STOP
        // ======================================
        //
        // On ne doit PAS envoyer le message
        // "a quitté le serveur" puisque c'était
        // un ban.
        //

        return;

    }


    // ==========================================
    // VRAI DEPART
    // ==========================================

    const leaveChannel =
        member.guild.channels.cache.get(
            "1415337084243410984"
        );


    if (!leaveChannel) {

        console.log(
            "❌ Salon départ introuvable"
        );

        return;

    }


    // ==========================================
    // NOMBRE DE MEMBRES
    // ==========================================

    const members =
        member.guild.members.cache.filter(

            m =>
                !m.user.bot

        ).size;


    // ==========================================
    // EMBED DEPART
    // ==========================================

    const embed =
        new EmbedBuilder()

            .setColor(
                "#ED4245"
            )

            .setTitle(
                "👋 Un membre nous quitte..."
            )

            .setThumbnail(

                member.user.displayAvatarURL({

                    dynamic: true,

                    size: 1024

                })

            )

            .setDescription(
`
😢 **${member.user.tag}** a quitté **NebuCommunity**.

━━━━━━━━━━━━━━━━━━

👥 Nous sommes maintenant :

**${members} membres**

💜 Merci d'avoir fait partie de l'aventure.

À bientôt peut-être...
`
            )

            .setFooter({

                text:
                    "NebuBot • Départs"

            })


    // ==========================================
    // ENVOYER DEPART
    // ==========================================

    try {

        await leaveChannel.send({

            embeds: [
                embed
            ]

        });


        console.log(
            "✅ Message de départ envoyé pour",
            member.user.tag
        );


    } catch (error) {

        console.error(
            "❌ Erreur message départ :",
            error
        );

    }

};