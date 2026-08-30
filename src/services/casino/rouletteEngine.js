const { createCanvas } = require("canvas");
const fs = require("fs");
const { spawn } = require("child_process");

// ======================================================
// CONFIGURATION
// ======================================================

const WIDTH = 960;
const HEIGHT = 540;

const FPS = 30;
const DURATION = 5.2;

const FFMPEG_PATH =
    "C:\\Users\\ausxj\\Desktop\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe";

// ======================================================
// ORDRE ROULETTE EUROPEENNE
// ======================================================

const WHEEL = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
    6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9,
    22, 18, 29, 7, 28, 12, 35, 3, 26
];

// ======================================================
// NUMEROS ROUGES
// ======================================================

const RED = new Set([
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25, 27,
    30, 32, 34, 36
]);

// ======================================================
// COULEUR
// ======================================================

function getColor(number) {

    if (number === 0) {
        return "vert";
    }

    return RED.has(number)
        ? "rouge"
        : "noir";
}

// ======================================================
// UTILITAIRES
// ======================================================

function clamp(
    value,
    min,
    max
) {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}

function easeOut(
    value
) {

    value =
        clamp(
            value,
            0,
            1
        );

    return (
        1 -
        Math.pow(
            1 - value,
            4
        )
    );
}

// ======================================================
// VERIFICATION RESULTAT
// ======================================================

function validateResult(
    number
) {

    number =
        Number(number);

    if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 36
    ) {

        throw new Error(
            `Résultat roulette invalide : ${number}`
        );
    }

    return number;
}

// ======================================================
// DESSIN D'UNE FRAME
// ======================================================

function drawFrame(
    ctx,
    result,
    frame,
    totalFrames
) {

    const t =
        frame /
        Math.max(
            1,
            totalFrames - 1
        );

    const width =
        WIDTH;

    const height =
        HEIGHT;

    // ==================================================
    // FOND
    // ==================================================

    const background =
        ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

    background.addColorStop(
        0,
        "#08060d"
    );

    background.addColorStop(
        0.55,
        "#1b0d27"
    );

    background.addColorStop(
        1,
        "#050308"
    );

    ctx.fillStyle =
        background;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    // ==================================================
    // LUMIERE CENTRALE
    // ==================================================

    const glow =
        ctx.createRadialGradient(
            width / 2,
            height * 0.46,
            20,
            width / 2,
            height * 0.46,
            420
        );

    glow.addColorStop(
        0,
        "rgba(168,85,247,0.20)"
    );

    glow.addColorStop(
        1,
        "rgba(168,85,247,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    // ==================================================
    // TABLE
    // ==================================================

    const table =
        ctx.createRadialGradient(
            width / 2,
            height * 0.72,
            30,
            width / 2,
            height * 0.72,
            500
        );

    table.addColorStop(
        0,
        "#185a35"
    );

    table.addColorStop(
        1,
        "#06150b"
    );

    ctx.fillStyle =
        table;

    ctx.beginPath();

    ctx.roundRect(
        35,
        270,
        width - 70,
        240,
        40
    );

    ctx.fill();

    // Bordure table

    ctx.strokeStyle =
        "rgba(215,169,77,0.25)";

    ctx.lineWidth =
        3;

    ctx.stroke();

    // ==================================================
    // ROULETTE
    // ==================================================

    const centerX =
        width / 2;

    const centerY =
        245;

    const outerRadius =
        195;

    const pocketRadius =
        145;

    const step =
        Math.PI * 2 /
        WHEEL.length;

    const targetIndex =
        WHEEL.indexOf(
            result
        );

    const targetAngle =
        -Math.PI / 2 +
        targetIndex *
        step;

    let wheelRotation;
    let ballAngle;

    // ==================================================
    // ANIMATION
    // ==================================================

    if (
        t < 0.72
    ) {

        const progress =
            t / 0.72;

        wheelRotation =
            Math.PI * 2 *
            (
                1.2 +
                4.8 *
                progress
            );

        ballAngle =
            -Math.PI / 2 -
            Math.PI * 2 *
            7.5 *
            progress;

    } else {

        const slow =
            easeOut(
                (
                    t - 0.72
                ) /
                0.28
            );

        wheelRotation =
            Math.PI * 2 * 6 +
            Math.PI * 2 *
            0.72 *
            slow;

        ballAngle =
            targetAngle -
            Math.PI * 2 *
            0.75 *
            (
                1 -
                slow
            );
    }

    // ==================================================
    // ROULETTE ROTATIVE
    // ==================================================

    ctx.save();

    ctx.translate(
        centerX,
        centerY
    );

    ctx.rotate(
        wheelRotation
    );

    // ==================================================
    // COURONNE EXTERIEURE
    // ==================================================

    const rim =
        ctx.createRadialGradient(
            -30,
            -30,
            10,
            0,
            0,
            outerRadius + 20
        );

    rim.addColorStop(
        0,
        "#f1d27c"
    );

    rim.addColorStop(
        0.45,
        "#b5791e"
    );

    rim.addColorStop(
        0.8,
        "#6b3f0d"
    );

    rim.addColorStop(
        1,
        "#d6ad55"
    );

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        outerRadius + 18,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        rim;

    ctx.fill();

    // ==================================================
    // BOIS
    // ==================================================

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        outerRadius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#513019";

    ctx.fill();

    // ==================================================
    // CASES
    // ==================================================

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
                angle - step / 2
            ) *
            (
                outerRadius - 12
            ),

            Math.sin(
                angle - step / 2
            ) *
            (
                outerRadius - 12
            )
        );

        ctx.arc(
            0,
            0,
            outerRadius - 12,
            angle - step / 2,
            angle + step / 2
        );

        ctx.lineTo(
            Math.cos(
                angle + step / 2
            ) *
            pocketRadius,

            Math.sin(
                angle + step / 2
            ) *
            pocketRadius
        );

        ctx.arc(
            0,
            0,
            pocketRadius,
            angle + step / 2,
            angle - step / 2,
            true
        );

        ctx.closePath();

        // Couleur case

        if (
            number === 0
        ) {

            ctx.fillStyle =
                "#0b8f43";

        } else if (
            RED.has(number)
        ) {

            ctx.fillStyle =
                "#a61f28";

        } else {

            ctx.fillStyle =
                "#121212";
        }

        ctx.fill();

        ctx.strokeStyle =
            "rgba(255,255,255,0.08)";

        ctx.lineWidth =
            1;

        ctx.stroke();

        // ==================================================
        // NUMERO
        // ==================================================

        ctx.save();

        const textRadius =
            (
                outerRadius +
                pocketRadius
            ) / 2;

        const textX =
            Math.cos(angle) *
            textRadius;

        const textY =
            Math.sin(angle) *
            textRadius;

        ctx.translate(
            textX,
            textY
        );

        ctx.rotate(
            angle +
            Math.PI / 2
        );

        ctx.fillStyle =
            "#f7f1df";

        ctx.font =
            "bold 13px Arial";

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

    // ==================================================
    // CENTRE METALLIQUE
    // ==================================================

    const centerGradient =
        ctx.createRadialGradient(
            -10,
            -10,
            5,
            0,
            0,
            70
        );

    centerGradient.addColorStop(
        0,
        "#f1cf70"
    );

    centerGradient.addColorStop(
        0.45,
        "#b9852a"
    );

    centerGradient.addColorStop(
        1,
        "#54340f"
    );

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        62,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        centerGradient;

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        34,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#12301d";

    ctx.fill();

    ctx.restore();

    // ==================================================
    // BILLE
    // ==================================================

    const ballRadius =
        177;

    const ballX =
        centerX +
        Math.cos(ballAngle) *
        ballRadius;

    const ballY =
        centerY +
        Math.sin(ballAngle) *
        ballRadius *
        0.82;

    ctx.save();

    ctx.shadowColor =
        "rgba(0,0,0,0.70)";

    ctx.shadowBlur =
        14;

    ctx.shadowOffsetY =
        7;

    const ballGradient =
        ctx.createRadialGradient(
            ballX - 4,
            ballY - 4,
            1,
            ballX,
            ballY,
            11
        );

    ballGradient.addColorStop(
        0,
        "#ffffff"
    );

    ballGradient.addColorStop(
        0.55,
        "#dddddd"
    );

    ballGradient.addColorStop(
        1,
        "#777777"
    );

    ctx.beginPath();

    ctx.arc(
        ballX,
        ballY,
        9,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        ballGradient;

    ctx.fill();

    ctx.restore();

    // ==================================================
    // TITRE
    // ==================================================

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillStyle =
        "#f5f0e8";

    ctx.font =
        "bold 28px Arial";

    ctx.fillText(
        "NÉBUL ROULETTE",
        centerX,
        35
    );

    ctx.fillStyle =
        "rgba(255,255,255,0.65)";

    ctx.font =
        "15px Arial";

    ctx.fillText(
        t < 0.72
            ? "La bille tourne..."
            : "La bille ralentit...",
        centerX,
        60
    );

    // ==================================================
    // RESULTAT
    // ==================================================

    if (
        t > 0.92
    ) {

        const alpha =
            clamp(
                (
                    t -
                    0.92
                ) /
                0.08,
                0,
                1
            );

        ctx.save();

        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            "rgba(5,5,8,0.85)";

        ctx.beginPath();

        ctx.roundRect(
            centerX - 135,
            475,
            270,
            48,
            16
        );

        ctx.fill();

        ctx.strokeStyle =
            "#d3a84b";

        ctx.lineWidth =
            2;

        ctx.stroke();

        const color =
            getColor(
                result
            );

        ctx.fillStyle =
            color === "rouge"
                ? "#ff5564"
                : color === "noir"
                    ? "#ffffff"
                    : "#55f08c";

        ctx.font =
            "bold 23px Arial";

        ctx.fillText(
            `${result} • ${color.toUpperCase()}`,
            centerX,
            499
        );

        ctx.restore();
    }

    // ==================================================
    // BARRE DE PROGRESSION
    // ==================================================

    ctx.fillStyle =
        "rgba(255,255,255,0.08)";

    ctx.fillRect(
        70,
        520,
        width - 140,
        4
    );

    ctx.fillStyle =
        "#c89a43";

    ctx.fillRect(
        70,
        520,
        (
            width - 140
        ) * t,
        4
    );
}

// ======================================================
// GENERATION GIF
// ======================================================

function renderRoulette(
    result,
    outputPath,
    options = {}
) {

    const number =
        validateResult(
            result
        );

    const ffmpeg =
        options.ffmpegPath ||
        FFMPEG_PATH;

    if (
        !fs.existsSync(
            ffmpeg
        )
    ) {

        throw new Error(
            `FFmpeg introuvable : ${ffmpeg}`
        );
    }

    // ==================================================
    // CANVAS
    // ==================================================

    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );

    const ctx =
        canvas.getContext(
            "2d"
        );

    const totalFrames =
        Math.round(
            FPS *
            DURATION
        );

    // ==================================================
    // FFMPEG GIF
    // ==================================================

    const args = [

        "-y",

        "-f",
        "image2pipe",

        "-vcodec",
        "png",

        "-r",
        String(FPS),

        "-i",
        "pipe:0",

        "-an",

        // Optimisation GIF
        "-vf",
        "fps=20,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a",

        // Boucle infinie
        "-loop",
        "0",

        "-gifflags",
        "+transdiff",

        outputPath
    ];

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const process =
                spawn(
                    ffmpeg,
                    args,
                    {
                        windowsHide:
                            true,

                        stdio: [
                            "pipe",
                            "ignore",
                            "pipe"
                        ]
                    }
                );

            let stderr =
                "";

            let finished =
                false;

            // ==================================================
            // ERREUR STDIN
            // ==================================================
            //
            // IMPORTANT :
            // FFmpeg peut fermer stdin avant qu'on ait fini
            // d'envoyer toutes les frames.
            // On ne laisse surtout pas Node planter sur EPIPE.
            //

            process.stdin.on(
                "error",
                error => {

                    if (
                        error.code ===
                        "EPIPE"
                    ) {
                        return;
                    }

                    console.error(
                        "❌ Erreur stdin FFmpeg :",
                        error
                    );
                }
            );

            // ==================================================
            // STDERR
            // ==================================================

            process.stderr.on(
                "data",
                chunk => {

                    stderr +=
                        chunk.toString();
                }
            );

            // ==================================================
            // PROCESS ERROR
            // ==================================================

            process.on(
                "error",
                error => {

                    if (
                        finished
                    ) {
                        return;
                    }

                    finished =
                        true;

                    reject(
                        error
                    );
                }
            );

            // ==================================================
            // PROCESS FIN
            // ==================================================

            process.on(
                "close",
                code => {

                    if (
                        finished
                    ) {
                        return;
                    }

                    finished =
                        true;

                    if (
                        code === 0
                    ) {

                        resolve(
                            outputPath
                        );

                    } else {

                        reject(
                            new Error(
                                `FFmpeg roulette ${code}: ${stderr}`
                            )
                        );
                    }
                }
            );

            // ==================================================
            // GENERATION DES FRAMES
            // ==================================================

            try {

                for (
                    let i = 0;
                    i < totalFrames;
                    i++
                ) {

                    // FFmpeg a déjà fermé stdin
                    // ou le process est terminé :
                    if (
                        process.stdin.destroyed ||
                        process.killed
                    ) {
                        break;
                    }

                    drawFrame(
                        ctx,
                        number,
                        i,
                        totalFrames
                    );

                    process.stdin.write(
                        canvas.toBuffer(
                            "image/png"
                        )
                    );
                }

                if (
                    !process.stdin.destroyed
                ) {

                    process.stdin.end();
                }

            } catch (
                error
            ) {

                try {
                    process.stdin.destroy();
                } catch {}

                if (
                    !finished
                ) {

                    finished =
                        true;

                    try {
                        process.kill();
                    } catch {}

                    reject(
                        error
                    );
                }
            }
        }
    );
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {

    WHEEL,

    getColor,

    renderRoulette
};