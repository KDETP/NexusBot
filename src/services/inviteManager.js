const db =
    require("../database/database");


// ==========================================
// CACHE DES INVITATIONS
// ==========================================
//
// guildId => Map(inviteCode, uses)
//

const inviteCache =
    new Map();


// ==========================================
// CHARGER LES INVITATIONS D'UN SERVEUR
// ==========================================

async function loadGuildInvites(
    guild
) {

    try {

        const invites =
            await guild.invites.fetch();


        const cache =
            new Map();


        invites.forEach(
            invite => {

                cache.set(

                    invite.code,

                    invite.uses || 0

                );

            }
        );


        inviteCache.set(

            guild.id,

            cache

        );


        console.log(
            `📨 Invitations chargées : ${guild.name}`
        );


        return cache;

    } catch (error) {

        console.error(

            `❌ Impossible de charger les invitations de ${guild.name} :`,

            error.message

        );


        return new Map();

    }

}


// ==========================================
// INITIALISATION
// ==========================================

async function initialize(
    client
) {

    console.log(
        "📨 Initialisation du système d'invitations..."
    );


    for (
        const guild
        of client.guilds.cache.values()
    ) {

        await loadGuildInvites(
            guild
        );

    }


    console.log(
        "✅ Système d'invitations prêt."
    );

}


// ==========================================
// TROUVER L'INVITATION UTILISÉE
// ==========================================

async function getUsedInvite(
    guild
) {

    const oldCache =
        inviteCache.get(
            guild.id
        ) || new Map();


    let newInvites;


    try {

        newInvites =
            await guild.invites.fetch();

    } catch (error) {

        console.error(
            "❌ Impossible de récupérer les invitations :",
            error.message
        );


        return null;

    }


    let usedInvite =
        null;


    newInvites.forEach(
        invite => {

            const oldUses =
                oldCache.get(
                    invite.code
                ) || 0;


            const newUses =
                invite.uses || 0;


            if (
                newUses > oldUses
            ) {

                usedInvite =
                    invite;

            }

        }
    );


    // ======================================
    // METTRE LE CACHE A JOUR
    // ======================================

    const newCache =
        new Map();


    newInvites.forEach(
        invite => {

            newCache.set(

                invite.code,

                invite.uses || 0

            );

        }
    );


    inviteCache.set(

        guild.id,

        newCache

    );


    return usedInvite;

}


// ==========================================
// AJOUTER UNE INVITATION
// ==========================================

function addInvite(
    guildId,
    userId,
    memberId,
    inviteCode
) {

    db.serialize(() => {


        // ==================================
        // COMPTEUR
        // ==================================

        db.run(

            `
            INSERT INTO invites (
                guildId,
                userId,
                invites
            )

            VALUES (?, ?, 1)

            ON CONFLICT(
                guildId,
                userId
            )

            DO UPDATE SET
                invites = invites + 1
            `,

            [
                guildId,
                userId
            ],

            error => {

                if (error) {

                    console.error(
                        "❌ Erreur compteur invitations :",
                        error
                    );

                }

            }

        );


        // ==================================
        // HISTORIQUE
        // ==================================

        db.run(

            `
            INSERT OR REPLACE INTO invite_joins (
                guildId,
                memberId,
                inviterId,
                inviteCode,
                joinedAt
            )

            VALUES (?, ?, ?, ?, ?)
            `,

            [
                guildId,
                memberId,
                userId,
                inviteCode,
                Date.now()
            ],

            error => {

                if (error) {

                    console.error(
                        "❌ Erreur historique invitation :",
                        error
                    );

                }

            }

        );

    });

}


// ==========================================
// RECUPERER LE NOMBRE D'INVITATIONS
// ==========================================

function getInvites(
    guildId,
    userId
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

            db.get(

                `
                SELECT invites
                FROM invites
                WHERE guildId = ?
                AND userId = ?
                `,

                [
                    guildId,
                    userId
                ],

                (
                    error,
                    row
                ) => {

                    if (error) {

                        reject(
                            error
                        );

                        return;

                    }


                    resolve(

                        row
                            ? row.invites
                            : 0

                    );

                }

            );

        }

    );

}


// ==========================================
// RETIRER UNE INVITATION
// ==========================================
//
// Quand un membre quitte le serveur,
// on retrouve son inviteur grâce à
// invite_joins puis on retire 1.
//
// ==========================================

function removeInvite(
    guildId,
    memberId
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {


            // ==================================
            // CHERCHER L'INVITEUR
            // ==================================

            db.get(

                `
                SELECT inviterId
                FROM invite_joins
                WHERE guildId = ?
                AND memberId = ?
                `,

                [
                    guildId,
                    memberId
                ],

                (
                    error,
                    row
                ) => {

                    if (error) {

                        console.error(
                            "❌ Erreur recherche invitation :",
                            error
                        );

                        reject(
                            error
                        );

                        return;

                    }


                    // ==============================
                    // AUCUN INVITEUR
                    // ==============================

                    if (
                        !row ||
                        !row.inviterId
                    ) {

                        resolve(
                            null
                        );

                        return;

                    }


                    const inviterId =
                        row.inviterId;


                    // ==================================
                    // RETIRER 1 INVITATION
                    // ==================================

                    db.run(

                        `
                        UPDATE invites

                        SET invites =
                            CASE
                                WHEN invites > 0
                                THEN invites - 1
                                ELSE 0
                            END

                        WHERE guildId = ?
                        AND userId = ?
                        `,

                        [
                            guildId,
                            inviterId
                        ],

                        updateError => {

                            if (updateError) {

                                console.error(
                                    "❌ Erreur retrait invitation :",
                                    updateError
                                );

                                reject(
                                    updateError
                                );

                                return;

                            }


                            // ==================================
                            // SUPPRIMER L'HISTORIQUE
                            // ==================================

                            db.run(

                                `
                                DELETE FROM invite_joins

                                WHERE guildId = ?
                                AND memberId = ?
                                `,

                                [
                                    guildId,
                                    memberId
                                ],

                                deleteError => {

                                    if (
                                        deleteError
                                    ) {

                                        console.error(
                                            "❌ Erreur suppression historique :",
                                            deleteError
                                        );

                                        reject(
                                            deleteError
                                        );

                                        return;

                                    }


                                    console.log(

                                        `📤 Invitation retirée : ${memberId} → ${inviterId}`

                                    );


                                    resolve(
                                        inviterId
                                    );

                                }

                            );

                        }

                    );

                }

            );

        }

    );

}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    initialize,

    loadGuildInvites,

    getUsedInvite,

    addInvite,

    getInvites,

    removeInvite

};