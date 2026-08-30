const inviteManager =
    require("../services/inviteManager");


module.exports = async (client) => {

    console.log(
        `✅ ${client.user.tag} est connecté !`
    );


    // ==========================================
    // INITIALISATION DES INVITATIONS
    // ==========================================

    try {

        await inviteManager.initialize(
            client
        );

    } catch (error) {

        console.error(
            "❌ Erreur initialisation invitations :",
            error
        );

    }

};