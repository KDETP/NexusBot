module.exports = async (
    client,
    interaction
) => {

    // ==========================================
    // BOUTONS / MENUS / FORMULAIRES
    // ==========================================

    if (
        !interaction.isButton() &&
        !interaction.isStringSelectMenu() &&
        !interaction.isChannelSelectMenu() &&
        !interaction.isRoleSelectMenu() &&
        !interaction.isModalSubmit()
    ) {
        return;
    }

    const id = interaction.customId;

    // ==========================================
    // 🎰 QUIZ CASINO
    // ==========================================

    if (id.startsWith("quizcasi_")) {
        const quizCasiManager =
            require("./quizCasiManager.js");

        return quizCasiManager(
            client,
            interaction
        );
    }

    // ==========================================
    // 📢 SYSTÈME D'ANNONCES
    // ==========================================

    if (id.startsWith("annonce_")) {
        const announcementInteractions =
            require("./announcementInteractions.js");

        return announcementInteractions(
            client,
            interaction
        );
    }

    // ==========================================
    // 🎫 CRÉATION TICKET
    // ==========================================

    if (
        id === "create_ticket" ||
        id === "ticket_category"
    ) {
        const ticketButtons =
            require("./ticketButtons.js");

        return ticketButtons(
            client,
            interaction
        );
    }

    // ==========================================
    // 🎫 ACCEPTER / REFUSER
    // ==========================================

    if (
        id === "accept_ticket" ||
        id === "deny_ticket"
    ) {
        const ticketRequest =
            require("./ticketRequest.js");

        return ticketRequest(
            client,
            interaction
        );
    }

    // ==========================================
    // 🔒 FERMER TICKET
    // ==========================================

    if (id === "close_ticket") {
        const ticketClose =
            require("./ticketClose.js");

        return ticketClose(
            client,
            interaction
        );
    }

    // ==========================================
    // AUTRES HANDLERS
    // ==========================================

    const handlers = [
        "quizManager",
        "blackjackButtons",
        "casinoButtons",
        "casinoHelpMenu",
        "casinoMenu",
        "moderationButtons",
        "kickButtons",
        "banButtons",
        "giveawayButtons",
        "giftButtons"
    ];

    // ==========================================
    // EXÉCUTION
    // ==========================================

    for (const handler of handlers) {
        try {
            const event = require(`./${handler}.js`);

            await event(
                client,
                interaction
            );
        } catch (error) {
            console.error(
                `Erreur handler ${handler}:`,
                error.message
            );
        }
    }
};