const blackjack =
    require("../services/casino/blackjackManager");

const betManager =
    require("../services/casino/betManager");

const fs =
    require("fs");

const path =
    require("path");

const {
    AttachmentBuilder
} = require("discord.js");

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

function getEconomy() {

    const economy =
        JSON.parse(
            fs.readFileSync(
                economyPath,
                "utf8"
            )
        );

    return economy;
}

// ======================================================
// COMMANDE
// ======================================================

module.exports = {

    name: "bj",

    async execute(
        message,
        args
    ) {

        const economy =
            getEconomy();

        // Compte
        if (
            !economy[
                message.author.id
            ]
        ) {

            economy[
                message.author.id
            ] = {
                money: 500
            };

            fs.writeFileSync(
                economyPath,
                JSON.stringify(
                    economy,
                    null,
                    2
                )
            );
        }

        const money =
            economy[
                message.author.id
            ].money;

        // ==================================================
        // MISE
        // ==================================================

        const result =
            betManager.getBet(
                args[0],
                money
            );

        if (result.error) {

            return message.reply(
                result.error
            );
        }

        const bet =
            result.bet;

        // ==================================================
        // PARTIE DEJA ACTIVE
        // ==================================================

        if (
            blackjack.get(
                message.author.id
            )
        ) {

            return message.reply(
                "❌ Tu as déjà une partie de Blackjack en cours."
            );
        }

        // ==================================================
        // ARGENT
        // ==================================================

        if (
            money < bet
        ) {

            return message.reply(
                "❌ Tu n'as pas assez de NebuCoins."
            );
        }

        // ==================================================
        // CREATION
        // ==================================================

        const game =
            blackjack.create(
                message.author.id,
                bet
            );

        if (!game) {

            return message.reply(
                "❌ Impossible de créer la partie."
            );
        }

        // Débit seulement maintenant
        economy[
            message.author.id
        ].money -= bet;

        fs.writeFileSync(
            economyPath,
            JSON.stringify(
                economy,
                null,
                2
            )
        );

        // ==================================================
        // IMAGE
        // ==================================================

        const buffer =
            renderer.render(
                game,
                message.member.displayName ||
                    message.author.username,
                economy[
                    message.author.id
                ].money
            );

        const attachment =
            new AttachmentBuilder(
                buffer,
                {
                    name:
                        "blackjack.png"
                }
            );

        // ==================================================
        // BOUTONS
        // ==================================================

        const {
            ActionRowBuilder,
            ButtonBuilder,
            ButtonStyle
        } = require("discord.js");

        const buttons = [

            new ButtonBuilder()
                .setCustomId(
                    `bj_hit_${message.author.id}`
                )
                .setLabel(
                    "🎴 Tirer"
                )
                .setStyle(
                    ButtonStyle.Success
                ),

            new ButtonBuilder()
                .setCustomId(
                    `bj_stand_${message.author.id}`
                )
                .setLabel(
                    "✋ Rester"
                )
                .setStyle(
                    ButtonStyle.Danger
                ),

            new ButtonBuilder()
                .setCustomId(
                    `bj_double_${message.author.id}`
                )
                .setLabel(
                    "💰 Doubler"
                )
                .setStyle(
                    ButtonStyle.Primary
                ),

            new ButtonBuilder()
                .setCustomId(
                    `bj_cancel_${message.author.id}`
                )
                .setLabel(
                    "❌ Abandonner"
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
        ];

        // Split
        if (
            game.hands[0].cards.length === 2 &&
            game.hands[0].cards[0].rank ===
            game.hands[0].cards[1].rank
        ) {

            buttons.push(

                new ButtonBuilder()
                    .setCustomId(
                        `bj_split_${message.author.id}`
                    )
                    .setLabel(
                        "✂️ Split"
                    )
                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );
        }

        const row =
            new ActionRowBuilder()
                .addComponents(
                    buttons
                );

        // ==================================================
        // ENVOI
        // ==================================================

        return message.reply({

            embeds: [

                {
                    color: 0x8B5CF6,

                    title:
                        "🃏 Blackjack Nébul",

                    description:
                        "Ta partie est prête. Utilise les boutons ci-dessous.",

                    image: {
                        url:
                            "attachment://blackjack.png"
                    },

                    footer: {
                        text:
                            "Nébul Casino • Bonne chance"
                    }
                }
            ],

            files: [
                attachment
            ],

            components: [
                row
            ]
        });
    }
};