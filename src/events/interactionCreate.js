module.exports = async (
    client,
    interaction
) => {

    // ==========================================
    // UNIQUEMENT BOUTONS / MENUS
    // ==========================================

    if (
        !interaction.isButton() &&
        !interaction.isStringSelectMenu()
    ) {

        return;

    }


    const id =
        interaction.customId;


    // ==========================================
    // 🎰 QUIZ CASINO
    // ==========================================

    if (
        id.startsWith("quizcasi_")
    ) {

        const quizCasiManager =
            require("./quizCasiManager.js");


        return quizCasiManager(
            client,
            interaction
        );

    }


    // ==========================================
    // 🎵 NEBUMUSIC
    // ==========================================

    if (
        id.startsWith("music_")
    ) {

        const musicButtons =
            require("./musicButtons.js");


        return musicButtons(
            client,
            interaction
        );

    }


    // ==========================================
    // 🎫 CREATION TICKET
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
    // 🎫 ACCEPT / REFUSE
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

    if (
        id === "close_ticket"
    ) {

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
        "banButtons"

    ];


    // ==========================================
    // EXECUTION
    // ==========================================

    for (
        const handler of handlers
    ) {

        try {

            const event =
                require(
                    `./${handler}.js`
                );


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