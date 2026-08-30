const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder
} = require("discord.js");

const fs =
    require("fs");

const path =
    require("path");

const blackjack =
    require("../services/casino/blackjackManager");

const renderer =
    require("../services/casino/blackjackRenderer");

const economyPath =
    path.join(
        __dirname,
        "..",
        "data",
        "economy.json"
    );

// ======================================================
// ECONOMIE
// ======================================================

function loadEconomy() {

    return JSON.parse(
        fs.readFileSync(
            economyPath,
            "utf8"
        )
    );
}

function saveEconomy(
    economy
) {

    fs.writeFileSync(
        economyPath,
        JSON.stringify(
            economy,
            null,
            2
        )
    );
}

// ======================================================
// GAIN
// ======================================================

function addMoney(
    userId,
    amount
) {

    const economy =
        loadEconomy();

    if (
        !economy[userId]
    ) {

        economy[userId] = {
            money: 500
        };
    }

    economy[userId].money +=
        amount;

    saveEconomy(
        economy
    );

    return economy[userId].money;
}

// ======================================================
// BOUTONS
// ======================================================

function createButtons(
    game,
    ownerId
) {

    const hand =
        game.hands[
            game.currentHand
        ];

    const buttons = [];

    // Tirer
    buttons.push(

        new ButtonBuilder()
            .setCustomId(
                `bj_hit_${ownerId}`
            )
            .setLabel(
                "🎴 Tirer"
            )
            .setStyle(
                ButtonStyle.Success
            )
    );

    // Rester
    buttons.push(

        new ButtonBuilder()
            .setCustomId(
                `bj_stand_${ownerId}`
            )
            .setLabel(
                "✋ Rester"
            )
            .setStyle(
                ButtonStyle.Danger
            )
    );

    // Doubler uniquement 2 cartes
    if (
        hand.cards.length === 2 &&
        !hand.doubled
    ) {

        buttons.push(

            new ButtonBuilder()
                .setCustomId(
                    `bj_double_${ownerId}`
                )
                .setLabel(
                    "💰 Doubler"
                )
                .setStyle(
                    ButtonStyle.Primary
                )
        );
    }

    // Split
    if (
        !game.split &&
        game.hands.length === 1 &&
        hand.cards.length === 2 &&
        hand.cards[0].rank ===
        hand.cards[1].rank
    ) {

        buttons.push(

            new ButtonBuilder()
                .setCustomId(
                    `bj_split_${ownerId}`
                )
                .setLabel(
                    "✂️ Split"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        );
    }

    // Abandonner
    buttons.push(

        new ButtonBuilder()
            .setCustomId(
                `bj_cancel_${ownerId}`
            )
            .setLabel(
                "❌ Abandonner"
            )
            .setStyle(
                ButtonStyle.Secondary
            )
    );

    return new ActionRowBuilder()
        .addComponents(
            buttons
        );
}

// ======================================================
// IMAGE
// ======================================================

function createAttachment(
    game,
    username,
    balance
) {

    const buffer =
        renderer.render(
            game,
            username,
            balance
        );

    return new AttachmentBuilder(
        buffer,
        {
            name:
                "blackjack.png"
        }
    );
}

// ======================================================
// UPDATE PARTIE
// ======================================================

async function updateGame(
    interaction,
    game,
    ownerId
) {

    const economy =
        loadEconomy();

    const balance =
        economy[ownerId]
            ?.money ?? 0;

    const username =
        interaction.member
            ?.displayName ||
        interaction.user.username;

    const attachment =
        createAttachment(
            game,
            username,
            balance
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                0x8B5CF6
            )
            .setTitle(
                "🃏 Blackjack Nébul"
            )
            .setImage(
                "attachment://blackjack.png"
            )
            .setFooter({
                text:
                    "Nébul Casino"
            });

    return interaction.update({

        embeds: [
            embed
        ],

        files: [
            attachment
        ],

        components: [
            createButtons(
                game,
                ownerId
            )
        ]
    });
}

// ======================================================
// RESULTAT
// ======================================================

async function finishGame(
    interaction,
    game,
    ownerId
) {

    const economy =
        loadEconomy();

    if (
        !economy[ownerId]
    ) {

        economy[ownerId] = {
            money: 500
        };
    }

    let totalGain = 0;

    const results = [];

    // ==================================================
    // CHAQUE MAIN
    // ==================================================

    for (
        const hand of game.hands
    ) {

        const playerValue =
            blackjack.value(
                hand.cards
            );

        const dealerValue =
            blackjack.value(
                game.dealer
            );

        let gain = 0;
        let result = "";

        // Bust
        if (
            playerValue > 21
        ) {

            result =
                "💥 Bust";

        }

        // Blackjack naturel
        else if (
            playerValue === 21 &&
            hand.cards.length === 2 &&
            !hand.doubled &&
            dealerValue !== 21
        ) {

            gain =
                Math.floor(
                    hand.bet * 2.5
                );

            result =
                "🃏 BLACKJACK !";

        }

        // Croupier bust
        else if (
            dealerValue > 21
        ) {

            gain =
                hand.bet * 2;

            result =
                "🏆 Le croupier dépasse 21 !";

        }

        // Egalité
        else if (
            playerValue ===
            dealerValue
        ) {

            gain =
                hand.bet;

            result =
                "🤝 Égalité";

        }

        // Victoire
        else if (
            playerValue >
            dealerValue
        ) {

            gain =
                hand.bet * 2;

            result =
                "🏆 Victoire !";

        }

        // Défaite
        else {

            result =
                "❌ Le croupier gagne.";
        }

        totalGain +=
            gain;

        results.push({
            hand,
            playerValue,
            result,
            gain
        });
    }

    // ==================================================
    // PAIEMENT
    // ==================================================

    economy[ownerId].money +=
        totalGain;

    saveEconomy(
        economy
    );

    // ==================================================
    // IMAGE FINALE
    // ==================================================

    game.finished = true;

    const username =
        interaction.member
            ?.displayName ||
        interaction.user.username;

    const attachment =
        createAttachment(
            game,
            username,
            economy[ownerId].money
        );

    // ==================================================
    // TEXTE RESULTAT
    // ==================================================

    let description =
        "";

    results.forEach(
        (result, index) => {

            if (game.hands.length > 1) {

                description +=
                    `**Main ${index + 1}** — ${result.result}\n`;
            } else {

                description +=
                    `${result.result}\n`;
            }

            if (
                result.gain > 0
            ) {

                description +=
                    `💰 Retour : **${result.gain.toLocaleString("fr-FR")} NebuCoins**\n`;
            }

            description +=
                "\n";
        }
    );

    description +=
        `💳 Solde : **${economy[ownerId].money.toLocaleString("fr-FR")} NebuCoins**`;

    const embed =
        new EmbedBuilder()
            .setColor(
                totalGain > 0
                    ? 0x22C55E
                    : 0xEF4444
            )
            .setTitle(
                "🃏 Résultat du Blackjack"
            )
            .setDescription(
                description
            )
            .setImage(
                "attachment://blackjack.png"
            )
            .setFooter({
                text:
                    "Nébul Casino"
            });

    blackjack.end(
        ownerId
    );

    return interaction.update({

        embeds: [
            embed
        ],

        files: [
            attachment
        ],

        components: []
    });
}

// ======================================================
// HANDLER
// ======================================================

module.exports = async (
    client,
    interaction
) => {

    if (
        !interaction.isButton()
    ) {
        return;
    }

    const id =
        interaction.customId;

    if (
        !id.startsWith("bj_")
    ) {
        return;
    }

    // ==================================================
    // ID JOUEUR
    // ==================================================

    const parts =
        id.split("_");

    const action =
        parts[1];

    const ownerId =
        parts[2];

    // ==================================================
    // PROPRIETAIRE
    // ==================================================

    if (
        interaction.user.id !==
        ownerId
    ) {

        return interaction.reply({

            content:
                "❌ Cette partie ne t'appartient pas.",

            ephemeral: true
        });
    }

    // ==================================================
    // PARTIE
    // ==================================================

    const game =
        blackjack.get(
            ownerId
        );

    if (!game) {

        return interaction.reply({

            content:
                "❌ Cette partie est terminée ou introuvable.",

            ephemeral: true
        });
    }

    // ==================================================
    // HIT
    // ==================================================

    if (
        action === "hit"
    ) {

        blackjack.hit(
            ownerId
        );

        const current =
            game.hands[
                game.currentHand
            ];

        const value =
            blackjack.value(
                current.cards
            );

        // Bust
        if (
            value > 21
        ) {

            current.busted =
                true;

            // Split -> passer à l'autre main
            if (
                game.split &&
                game.currentHand === 0
            ) {

                blackjack.nextHand(
                    ownerId
                );

                return updateGame(
                    interaction,
                    game,
                    ownerId
                );
            }

            // Sinon résultat
            blackjack.dealerPlay(
                ownerId
            );

            return finishGame(
                interaction,
                game,
                ownerId
            );
        }

        return updateGame(
            interaction,
            game,
            ownerId
        );
    }

    // ==================================================
    // STAND
    // ==================================================

    if (
        action === "stand"
    ) {

        blackjack.stand(
            ownerId
        );

        // Si split et première main
        if (
            game.split &&
            game.currentHand === 0
        ) {

            blackjack.nextHand(
                ownerId
            );

            return updateGame(
                interaction,
                game,
                ownerId
            );
        }

        // Dernière main
        blackjack.dealerPlay(
            ownerId
        );

        return finishGame(
            interaction,
            game,
            ownerId
        );
    }

    // ==================================================
    // DOUBLE
    // ==================================================

    if (
        action === "double"
    ) {

        const economy =
            loadEconomy();

        const hand =
            game.hands[
                game.currentHand
            ];

        // Vérification argent
        if (
            economy[ownerId].money <
            game.originalBet
        ) {

            return interaction.reply({

                content:
                    "❌ Tu n'as pas assez de NebuCoins pour doubler.",

                ephemeral: true
            });
        }

        const result =
            blackjack.double(
                ownerId
            );

        if (!result) {

            return interaction.reply({

                content:
                    "❌ Tu ne peux plus doubler cette main.",

                ephemeral: true
            });
        }

        // Débit du supplément
        economy[ownerId].money -=
            game.originalBet;

        saveEconomy(
            economy
        );

        // Split : passer à la main suivante
        if (
            game.split &&
            game.currentHand === 0
        ) {

            blackjack.nextHand(
                ownerId
            );

            return updateGame(
                interaction,
                game,
                ownerId
            );
        }

        // Fin
        blackjack.dealerPlay(
            ownerId
        );

        return finishGame(
            interaction,
            game,
            ownerId
        );
    }

    // ==================================================
    // SPLIT
    // ==================================================

    if (
        action === "split"
    ) {

        const economy =
            loadEconomy();

        // Il faut payer une deuxième mise
        if (
            economy[ownerId].money <
            game.originalBet
        ) {

            return interaction.reply({

                content:
                    "❌ Tu n'as pas assez de NebuCoins pour faire un Split.",

                ephemeral: true
            });
        }

        const result =
            blackjack.split(
                ownerId
            );

        if (!result) {

            return interaction.reply({

                content:
                    "❌ Split impossible.",

                ephemeral: true
            });
        }

        economy[ownerId].money -=
            game.originalBet;

        saveEconomy(
            economy
        );

        return updateGame(
            interaction,
            game,
            ownerId
        );
    }

    // ==================================================
    // ABANDONNER
    // ==================================================

    if (
        action === "cancel"
    ) {

        blackjack.end(
            ownerId
        );

        return interaction.update({

            embeds: [

                new EmbedBuilder()
                    .setColor(
                        0xEF4444
                    )
                    .setTitle(
                        "❌ Blackjack abandonné"
                    )
                    .setDescription(
                        "Tu as abandonné la partie.\n\n💸 Ta mise est perdue."
                    )
            ],

            components: []
        });
    }
};