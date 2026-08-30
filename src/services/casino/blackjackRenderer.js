const { createCanvas } = require("canvas");

// ======================================================
// CONFIGURATION
// ======================================================

const WIDTH = 1400;
const HEIGHT = 900;

const CARD_WIDTH = 180;
const CARD_HEIGHT = 250;
const CARD_GAP = 22;

// ======================================================
// OUTILS
// ======================================================

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {
    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        width,
        height,
        radius
    );
}

function drawRoundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius,
    fill,
    stroke = null,
    lineWidth = 1
) {
    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    );

    ctx.fillStyle =
        fill;

    ctx.fill();

    if (stroke) {

        ctx.strokeStyle =
            stroke;

        ctx.lineWidth =
            lineWidth;

        ctx.stroke();
    }
}

function formatMoney(value) {

    return Number(value || 0)
        .toLocaleString("fr-FR");
}

function suitIsRed(suit) {

    return (
        suit === "♥" ||
        suit === "♦"
    );
}

// ======================================================
// JETONS
// ======================================================
//
// Chaque jeton possède :
// valeur
// couleur
// ======================================================

const CHIP_VALUES = [

    {
        value: 100000,
        color: "#7C3AED",
        inner: "#A78BFA"
    },

    {
        value: 50000,
        color: "#2563EB",
        inner: "#60A5FA"
    },

    {
        value: 10000,
        color: "#DC2626",
        inner: "#F87171"
    },

    {
        value: 5000,
        color: "#16A34A",
        inner: "#4ADE80"
    },

    {
        value: 1000,
        color: "#EAB308",
        inner: "#FDE047"
    },

    {
        value: 500,
        color: "#F97316",
        inner: "#FB923C"
    },

    {
        value: 100,
        color: "#06B6D4",
        inner: "#67E8F9"
    },

    {
        value: 50,
        color: "#EC4899",
        inner: "#F472B6"
    },

    {
        value: 25,
        color: "#64748B",
        inner: "#CBD5E1"
    },

    {
        value: 10,
        color: "#22C55E",
        inner: "#86EFAC"
    }
];

// ======================================================
// CALCUL DES JETONS
// ======================================================

function calculateChips(amount) {

    let remaining =
        Math.max(
            0,
            Math.floor(
                Number(amount) || 0
            )
        );

    const chips = [];

    for (
        const chip of CHIP_VALUES
    ) {

        const count =
            Math.floor(
                remaining /
                chip.value
            );

        if (count <= 0) {
            continue;
        }

        // On évite d'avoir 100 jetons identiques
        // à l'écran.
        const displayCount =
            Math.min(
                count,
                12
            );

        chips.push({
            ...chip,
            count: displayCount
        });

        remaining -=
            count *
            chip.value;
    }

    return chips;
}

// ======================================================
// DESSIN D'UN JETON
// ======================================================

function drawChip(
    ctx,
    x,
    y,
    chip,
    scale = 1
) {

    const radius =
        34 * scale;

    // Ombre
    ctx.save();

    ctx.shadowColor =
        "rgba(0,0,0,0.55)";

    ctx.shadowBlur =
        12;

    ctx.shadowOffsetY =
        7;

    // Cercle principal
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        chip.color;

    ctx.fill();

    ctx.restore();

    // Bordure
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "#FFFFFF";

    ctx.lineWidth =
        3 * scale;

    ctx.stroke();

    // Intérieur
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius * 0.68,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        chip.inner;

    ctx.lineWidth =
        3 * scale;

    ctx.stroke();

    // Petits traits du jeton
    ctx.strokeStyle =
        "rgba(255,255,255,0.75)";

    ctx.lineWidth =
        3 * scale;

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            (
                Math.PI * 2 /
                8
            ) * i;

        const x1 =
            x +
            Math.cos(angle) *
            radius *
            0.72;

        const y1 =
            y +
            Math.sin(angle) *
            radius *
            0.72;

        const x2 =
            x +
            Math.cos(angle) *
            radius *
            0.92;

        const y2 =
            y +
            Math.sin(angle) *
            radius *
            0.92;

        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();
    }

    // Valeur
    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        `bold ${Math.max(
            12,
            15 * scale
        )}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        chip.value >= 1000
            ? `${chip.value / 1000}K`
            : chip.value,
        x,
        y
    );
}

// ======================================================
// DESSIN DES JETONS
// ======================================================

function drawBetChips(
    ctx,
    amount,
    centerX,
    centerY
) {

    const chips =
        calculateChips(
            amount
        );

    if (!chips.length) {
        return;
    }

    // Position horizontale
    const stackSpacing = 85;

    const totalWidth =
        (
            chips.length - 1
        ) *
        stackSpacing;

    let startX =
        centerX -
        totalWidth / 2;

    chips.forEach(
        chip => {

            const maxVisible =
                Math.min(
                    chip.count,
                    8
                );

            for (
                let i = 0;
                i < maxVisible;
                i++
            ) {

                drawChip(
                    ctx,

                    startX,

                    centerY -
                        i * 7,

                    chip,

                    0.85
                );
            }

            // Quantité
            if (
                chip.count > 1
            ) {

                ctx.fillStyle =
                    "#FFFFFF";

                ctx.font =
                    "bold 16px Arial";

                ctx.textAlign =
                    "center";

                ctx.textBaseline =
                    "top";

                ctx.fillText(
                    `×${chip.count}`,
                    startX,
                    centerY + 38
                );
            }

            startX +=
                stackSpacing;
        }
    );
}

// ======================================================
// CARTE
// ======================================================

function drawCard(
    ctx,
    card,
    x,
    y,
    hidden = false,
    scale = 1
) {

    const width =
        CARD_WIDTH *
        scale;

    const height =
        CARD_HEIGHT *
        scale;

    // Ombre
    ctx.save();

    ctx.shadowColor =
        "rgba(0,0,0,0.60)";

    ctx.shadowBlur =
        18;

    ctx.shadowOffsetY =
        10;

    drawRoundedRect(
        ctx,
        x,
        y,
        width,
        height,
        16,
        "#FFFFFF"
    );

    ctx.restore();

    // ==================================================
    // DOS
    // ==================================================

    if (hidden) {

        drawRoundedRect(
            ctx,
            x,
            y,
            width,
            height,
            16,
            "#201044",
            "#A78BFA",
            4
        );

        ctx.save();

        ctx.beginPath();

        ctx.roundRect(
            x + 12,
            y + 12,
            width - 24,
            height - 24,
            10
        );

        ctx.clip();

        ctx.strokeStyle =
            "rgba(167,139,250,0.25)";

        ctx.lineWidth =
            3;

        for (
            let i = -height;
            i < width + height;
            i += 25
        ) {

            ctx.beginPath();

            ctx.moveTo(
                x + i,
                y
            );

            ctx.lineTo(
                x + i + height,
                y + height
            );

            ctx.stroke();
        }

        ctx.restore();

        ctx.fillStyle =
            "#C4B5FD";

        ctx.font =
            "bold 90px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            "N",
            x + width / 2,
            y + height / 2
        );

        return;
    }

    // ==================================================
    // FACE
    // ==================================================

    drawRoundedRect(
        ctx,
        x,
        y,
        width,
        height,
        16,
        "#FAFAFA",
        "#D4D4D8",
        3
    );

    const color =
        suitIsRed(
            card.suit
        )
            ? "#DC2626"
            : "#111827";

    // Haut gauche
    ctx.fillStyle =
        color;

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "top";

    ctx.font =
        "bold 48px Arial";

    ctx.fillText(
        card.rank,
        x + 18,
        y + 14
    );

    ctx.font =
        "38px Arial";

    ctx.fillText(
        card.suit,
        x + 21,
        y + 64
    );

    // Centre
    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.font =
        "88px Arial";

    ctx.fillText(
        card.suit,
        x + width / 2,
        y + height / 2
    );

    // Bas droite
    ctx.save();

    ctx.translate(
        x + width - 18,
        y + height - 18
    );

    ctx.rotate(
        Math.PI
    );

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "top";

    ctx.font =
        "bold 48px Arial";

    ctx.fillText(
        card.rank,
        0,
        0
    );

    ctx.font =
        "38px Arial";

    ctx.fillText(
        card.suit,
        3,
        50
    );

    ctx.restore();
}

// ======================================================
// MAIN
// ======================================================

function drawHand(
    ctx,
    cards,
    y,
    hiddenSecond = false
) {

    const totalWidth =
        cards.length *
            CARD_WIDTH +
        (
            cards.length - 1
        ) *
            CARD_GAP;

    let x =
        (
            WIDTH -
            totalWidth
        ) / 2;

    cards.forEach(
        (
            card,
            index
        ) => {

            drawCard(
                ctx,
                card,
                x,
                y,
                hiddenSecond &&
                    index === 1
            );

            x +=
                CARD_WIDTH +
                CARD_GAP;
        }
    );
}

// ======================================================
// VALEUR
// ======================================================

function getValue(hand) {

    let total = 0;
    let aces = 0;

    for (
        const card of hand
    ) {

        if (
            card.rank === "A"
        ) {

            total += 11;
            aces++;

        } else {

            total +=
                card.value;
        }
    }

    while (
        total > 21 &&
        aces > 0
    ) {

        total -= 10;
        aces--;
    }

    return total;
}

// ======================================================
// BADGE VALEUR
// ======================================================

function drawValueBadge(
    ctx,
    value,
    x,
    y,
    active = false
) {

    let background =
        "#24123E";

    let border =
        "#6D28D9";

    if (
        value > 21
    ) {

        background =
            "#4C1118";

        border =
            "#EF4444";

    } else if (
        value === 21
    ) {

        background =
            "#123C2A";

        border =
            "#22C55E";
    }

    if (active) {

        border =
            "#A78BFA";
    }

    drawRoundedRect(
        ctx,
        x,
        y,
        220,
        58,
        18,
        background,
        border,
        3
    );

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 24px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        value > 21
            ? `💥 ${value}`
            : `VALEUR  ${value}`,
        x + 110,
        y + 29
    );
}

// ======================================================
// RENDER
// ======================================================

function render(
    game,
    username,
    balance
) {

    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );

    const ctx =
        canvas.getContext(
            "2d"
        );

    // ==================================================
    // FOND
    // ==================================================

    const background =
        ctx.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    background.addColorStop(
        0,
        "#100719"
    );

    background.addColorStop(
        0.45,
        "#241038"
    );

    background.addColorStop(
        1,
        "#0B0512"
    );

    ctx.fillStyle =
        background;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    // Glow
    const glow =
        ctx.createRadialGradient(
            WIDTH / 2,
            HEIGHT / 2,
            100,
            WIDTH / 2,
            HEIGHT / 2,
            700
        );

    glow.addColorStop(
        0,
        "rgba(139,92,246,0.18)"
    );

    glow.addColorStop(
        1,
        "rgba(139,92,246,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    // ==================================================
    // CADRE
    // ==================================================

    drawRoundedRect(
        ctx,
        25,
        25,
        WIDTH - 50,
        HEIGHT - 50,
        28,
        "rgba(16,7,25,0.35)",
        "#6D28D9",
        3
    );

    // ==================================================
    // HEADER
    // ==================================================

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 38px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "BLACKJACK",
        WIDTH / 2,
        65
    );

    ctx.fillStyle =
        "#A78BFA";

    ctx.font =
        "bold 16px Arial";

    ctx.fillText(
        "NÉBULAE CASINO",
        WIDTH / 2,
        95
    );

    // Ligne
    ctx.strokeStyle =
        "rgba(167,139,250,0.25)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        70,
        120
    );

    ctx.lineTo(
        WIDTH - 70,
        120
    );

    ctx.stroke();

    // ==================================================
    // CROUPIER
    // ==================================================

    ctx.fillStyle =
        "#C4B5FD";

    ctx.font =
        "bold 22px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "♛  CROUPIER",
        70,
        155
    );

    const dealerVisible =
        game.finished
            ? game.dealer
            : [
                game.dealer[0]
            ];

    drawValueBadge(
        ctx,
        getValue(
            dealerVisible
        ),
        WIDTH - 300,
        128
    );

    drawHand(
        ctx,
        game.dealer,
        180,
        !game.finished
    );

    // ==================================================
    // SEPARATION
    // ==================================================

    ctx.strokeStyle =
        "rgba(167,139,250,0.18)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        70,
        470
    );

    ctx.lineTo(
        WIDTH - 70,
        470
    );

    ctx.stroke();

    // ==================================================
    // JOUEUR
    // ==================================================

    ctx.fillStyle =
        "#C4B5FD";

    ctx.font =
        "bold 22px Arial";

    ctx.textAlign =
        "left";

    ctx.fillText(
        `♟  ${username}`,
        70,
        510
    );

    const hand =
        game.hands[
            game.currentHand
        ];

    drawValueBadge(
        ctx,
        getValue(
            hand.cards
        ),
        WIDTH - 300,
        483,
        true
    );

    drawHand(
        ctx,
        hand.cards,
        535
    );

    // ==================================================
    // ZONE MISE
    // ==================================================

    const betAmount =
        Number(
            game.totalBet || 0
        );

    drawRoundedRect(
        ctx,
        70,
        800,
        WIDTH - 140,
        75,
        20,
        "rgba(12,6,20,0.88)",
        "rgba(167,139,250,0.35)",
        2
    );

    // Titre
    ctx.fillStyle =
        "#C4B5FD";

    ctx.font =
        "bold 18px Arial";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "💰 MISE",
        95,
        825
    );

    // Montant
    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 27px Arial";

    ctx.fillText(
        `${formatMoney(
            betAmount
        )} NebuCoins`,
        95,
        853
    );

    // ==================================================
    // JETONS
    // ==================================================

    drawBetChips(
        ctx,
        betAmount,
        WIDTH - 320,
        837
    );

    // ==================================================
    // SOLDE
    // ==================================================

    ctx.textAlign =
        "right";

    ctx.fillStyle =
        "#C4B5FD";

    ctx.font =
        "bold 16px Arial";

    ctx.fillText(
        "💳 SOLDE",
        WIDTH - 90,
        817
    );

    ctx.fillStyle =
        "#FFFFFF";

    ctx.font =
        "bold 22px Arial";

    ctx.fillText(
        `${formatMoney(
            balance
        )}`,
        WIDTH - 90,
        850
    );

    // ==================================================
    // SPLIT
    // ==================================================

    if (
        game.split
    ) {

        ctx.fillStyle =
            "#A78BFA";

        ctx.font =
            "bold 15px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            `MAIN ${
                game.currentHand + 1
            } / ${
                game.hands.length
            }`,
            WIDTH / 2,
            815
        );
    }

    return canvas.toBuffer(
        "image/png"
    );
}

module.exports = {
    render
};