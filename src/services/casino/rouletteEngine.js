const fs = require("fs");
const path = require("path");
const GIFEncoder = require("gif-encoder-2");
const { createCanvas } = require("canvas");


// =====================================================
// CONFIG
// =====================================================

const WIDTH = 800;
const HEIGHT = 500;

const FPS = 20;
const DURATION = 4.2;

const TOTAL_FRAMES =
    Math.round(FPS * DURATION);


// =====================================================
// ROUE EUROPÉENNE
// =====================================================

const WHEEL = [
    0, 32, 15, 19, 4, 21, 2, 25, 17,
    34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31,
    9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];


// =====================================================
// ROUGE
// =====================================================

const RED = new Set([
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25, 27,
    30, 32, 34, 36
]);


// =====================================================
// COULEUR
// =====================================================

function getColor(number) {

    if (number === 0) {
        return "vert";
    }

    return RED.has(number)
        ? "rouge"
        : "noir";
}


// =====================================================
// EASING
// =====================================================

function easeOutCubic(t) {

    t = Math.max(
        0,
        Math.min(1, t)
    );

    return 1 - Math.pow(
        1 - t,
        3
    );
}


// =====================================================
// DRAW FRAME
// =====================================================

function drawFrame(
    ctx,
    result,
    frame
) {

    const t =
        frame /
        Math.max(
            1,
            TOTAL_FRAMES - 1
        );


    // =================================================
    // BACKGROUND
    // =================================================

    const bg =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );

    bg.addColorStop(
        0,
        "#090612"
    );

    bg.addColorStop(
        0.5,
        "#1b0d28"
    );

    bg.addColorStop(
        1,
        "#050308"
    );

    ctx.fillStyle =
        bg;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // =================================================
    // TITRE
    // =================================================

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#f7f1ff";

    ctx.font =
        "bold 30px Arial";

    ctx.fillText(
        "NÉBUL ROULETTE",
        WIDTH / 2,
        32
    );


    // =================================================
    // TABLE
    // =================================================

    const table =
        ctx.createRadialGradient(
            WIDTH / 2,
            350,
            20,
            WIDTH / 2,
            350,
            430
        );

    table.addColorStop(
        0,
        "#17623b"
    );

    table.addColorStop(
        1,
        "#06150d"
    );

    ctx.fillStyle =
        table;

    ctx.beginPath();

    ctx.roundRect(
        45,
        280,
        WIDTH - 90,
        180,
        35
    );

    ctx.fill();


    // =================================================
    // ROUE
    // =================================================

    const cx =
        WIDTH / 2;

    const cy =
        225;

    const outer =
        170;

    const inner =
        120;

    const step =
        (Math.PI * 2) /
        WHEEL.length;


    const targetIndex =
        WHEEL.indexOf(result);


    /*
     * Le numéro gagnant doit arriver exactement
     * sous le pointeur à la fin.
     */

    const finalRotation =
        -(targetIndex * step);


    const spins =
        Math.PI * 2 * 7;


    const rotation =
        finalRotation +
        spins *
        (
            1 -
            easeOutCubic(t)
        );


    // =================================================
    // ROUE
    // =================================================

    ctx.save();

    ctx.translate(
        cx,
        cy
    );

    ctx.rotate(
        rotation
    );


    // Couronne dorée
    const gold =
        ctx.createRadialGradient(
            -30,
            -30,
            10,
            0,
            0,
            outer + 25
        );

    gold.addColorStop(
        0,
        "#ffe7a1"
    );

    gold.addColorStop(
        0.45,
        "#cb9639"
    );

    gold.addColorStop(
        0.8,
        "#704710"
    );

    gold.addColorStop(
        1,
        "#dcb45c"
    );


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        outer + 18,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        gold;

    ctx.fill();


    // Fond
    ctx.beginPath();

    ctx.arc(
        0,
        0,
        outer,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#27170b";

    ctx.fill();


    // =================================================
    // CASES
    // =================================================

    for (
        let i = 0;
        i < WHEEL.length;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i * step;

        const number =
            WHEEL[i];


        ctx.beginPath();


        ctx.moveTo(
            Math.cos(
                angle -
                step / 2
            ) *
                outer,

            Math.sin(
                angle -
                step / 2
            ) *
                outer
        );


        ctx.arc(
            0,
            0,
            outer,
            angle - step / 2,
            angle + step / 2
        );


        ctx.lineTo(
            Math.cos(
                angle +
                step / 2
            ) *
                inner,

            Math.sin(
                angle +
                step / 2
            ) *
                inner
        );


        ctx.arc(
            0,
            0,
            inner,
            angle + step / 2,
            angle - step / 2,
            true
        );


        ctx.closePath();


        ctx.fillStyle =
            number === 0
                ? "#0b9347"
                : RED.has(number)
                    ? "#a92330"
                    : "#111111";


        ctx.fill();


        ctx.strokeStyle =
            "rgba(255,255,255,0.08)";

        ctx.lineWidth = 1;

        ctx.stroke();


        // Numéro
        ctx.save();


        const textRadius =
            (
                outer +
                inner
            ) / 2;


        ctx.translate(
            Math.cos(angle) *
                textRadius,

            Math.sin(angle) *
                textRadius
        );


        ctx.rotate(
            angle +
            Math.PI / 2
        );


        ctx.fillStyle =
            "#f7f1df";

        ctx.font =
            "bold 12px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            String(number),
            0,
            0
        );


        ctx.restore();

    }


    // =================================================
    // CENTRE
    // =================================================

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        53,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#b78324";

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        30,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#19452b";

    ctx.fill();


    ctx.restore();


    // =================================================
    // BILLE
    // =================================================

    const pointerAngle =
        -Math.PI / 2;


    let ballAngle;


    if (t < 0.78) {

        const progress =
            t / 0.78;


        ballAngle =
            pointerAngle -
            Math.PI * 2 *
            10 *
            progress;

    } else {

        const settle =
            easeOutCubic(
                (t - 0.78) /
                0.22
            );


        const startingAngle =
            pointerAngle -
            Math.PI * 2 *
            10;


        ballAngle =
            startingAngle +
            (
                pointerAngle -
                startingAngle
            ) *
            settle;
    }


    const ballRadius =
        154;


    const bx =
        cx +
        Math.cos(
            ballAngle
        ) *
        ballRadius;


    const by =
        cy +
        Math.sin(
            ballAngle
        ) *
        ballRadius *
        0.82;


    ctx.save();


    ctx.shadowColor =
        "rgba(0,0,0,0.7)";

    ctx.shadowBlur =
        12;

    ctx.shadowOffsetY =
        6;


    const ball =
        ctx.createRadialGradient(
            bx - 3,
            by - 3,
            1,
            bx,
            by,
            10
        );


    ball.addColorStop(
        0,
        "#ffffff"
    );

    ball.addColorStop(
        0.55,
        "#eeeeee"
    );

    ball.addColorStop(
        1,
        "#777777"
    );


    ctx.beginPath();

    ctx.arc(
        bx,
        by,
        8,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        ball;

    ctx.fill();


    ctx.restore();


    // =================================================
    // POINTEUR
    // =================================================

    ctx.fillStyle =
        "#f1cc71";


    ctx.beginPath();

    ctx.moveTo(
        cx,
        60
    );

    ctx.lineTo(
        cx - 11,
        79
    );

    ctx.lineTo(
        cx + 11,
        79
    );

    ctx.closePath();

    ctx.fill();


    // =================================================
    // TEXTE PENDANT LE SPIN
    // =================================================

    ctx.fillStyle =
        "rgba(255,255,255,0.72)";

    ctx.font =
        "15px Arial";


    let status;

    if (t < 0.55) {

        status =
            "La bille tourne...";

    } else if (t < 0.82) {

        status =
            "La roue ralentit...";

    } else {

        status =
            "La bille cherche sa case...";

    }


    ctx.fillText(
        status,
        cx,
        60
    );


    // =================================================
    // BARRE DE PROGRESSION
    // =================================================

    ctx.fillStyle =
        "rgba(255,255,255,0.08)";

    ctx.fillRect(
        80,
        478,
        WIDTH - 160,
        4
    );


    ctx.fillStyle =
        "#c89a43";

    ctx.fillRect(
        80,
        478,
        (WIDTH - 160) * t,
        4
    );

}


// =====================================================
// RENDER
// =====================================================

async function renderRoulette(
    result,
    outputPath
) {

    const number =
        Number(result);


    if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 36
    ) {

        throw new Error(
            "Résultat roulette invalide."
        );

    }


    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );


    const ctx =
        canvas.getContext(
            "2d"
        );


    const encoder =
        new GIFEncoder(
            WIDTH,
            HEIGHT,
            "octree",
            false,
            TOTAL_FRAMES
        );


    encoder.start();

    // On laisse Discord afficher le résultat final
    // après l'animation, donc pas besoin de boucle.
    encoder.setDelay(
        1000 / FPS
    );

    encoder.setQuality(
        10
    );


    for (
        let frame = 0;
        frame < TOTAL_FRAMES;
        frame++
    ) {

        drawFrame(
            ctx,
            number,
            frame
        );


        encoder.addFrame(
            ctx
        );

    }


    encoder.finish();


    const buffer =
        encoder.out.getData();


    fs.mkdirSync(
        path.dirname(
            outputPath
        ),
        {
            recursive: true
        }
    );


    fs.writeFileSync(
        outputPath,
        buffer
    );


    return outputPath;
}


module.exports = {
    WHEEL,
    getColor,
    renderRoulette,
    DURATION
};