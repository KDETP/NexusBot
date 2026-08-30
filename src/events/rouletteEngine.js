const { createCanvas } = require("canvas");
const { spawn } = require("child_process");

const WIDTH = 960;
const HEIGHT = 540;
const FPS = 30;
const DURATION = 5.2;

const FFMPEG_PATH =
    "C:\\Users\\ausxj\\Desktop\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe";

const WHEEL = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34,
    6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9,
    22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED = new Set([
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
]);

function colorOf(n) {
    if (n === 0) return "vert";
    return RED.has(n) ? "rouge" : "noir";
}

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - Math.pow(1 - t, 4);
}

function validateResult(n) {
    n = Number(n);
    if (!Number.isInteger(n) || n < 0 || n > 36) {
        throw new Error("Résultat roulette invalide.");
    }
    return n;
}

function drawFrame(ctx, result, frame, total) {
    const w = WIDTH;
    const h = HEIGHT;
    const t = frame / Math.max(1, total - 1);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#08060d");
    bg.addColorStop(0.55, "#1b0d27");
    bg.addColorStop(1, "#050308");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const table = ctx.createRadialGradient(
        w / 2, h * 0.72, 30,
        w / 2, h * 0.72, 500
    );
    table.addColorStop(0, "#185a35");
    table.addColorStop(1, "#06150b");

    ctx.fillStyle = table;
    ctx.beginPath();
    ctx.roundRect(35, 270, w - 70, 240, 40);
    ctx.fill();

    const cx = w / 2;
    const cy = 245;
    const outer = 195;
    const pocket = 145;
    const step = Math.PI * 2 / WHEEL.length;

    const targetIndex = WHEEL.indexOf(result);
    const targetAngle = -Math.PI / 2 + targetIndex * step;

    let wheelRotation;
    if (t < 0.72) {
        wheelRotation =
            Math.PI * 2 * (1.2 + 4.8 * (t / 0.72));
    } else {
        wheelRotation =
            Math.PI * 2 * 6 +
            Math.PI * 2 * 0.72 * easeOut((t - 0.72) / 0.28);
    }

    let ballAngle;
    if (t < 0.72) {
        ballAngle =
            -Math.PI / 2 -
            Math.PI * 2 * 7.5 * (t / 0.72);
    } else {
        ballAngle =
            targetAngle -
            Math.PI * 2 * 0.75 * (1 - easeOut((t - 0.72) / 0.28));
    }

    // Outer rim
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelRotation);

    const rim = ctx.createRadialGradient(-30, -30, 10, 0, 0, outer + 20);
    rim.addColorStop(0, "#f1d27c");
    rim.addColorStop(0.45, "#b5791e");
    rim.addColorStop(0.8, "#6b3f0d");
    rim.addColorStop(1, "#d6ad55");

    ctx.beginPath();
    ctx.arc(0, 0, outer + 18, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, Math.PI * 2);
    ctx.fillStyle = "#513019";
    ctx.fill();

    for (let i = 0; i < WHEEL.length; i++) {
        const a = -Math.PI / 2 + i * step;
        const n = WHEEL[i];

        ctx.beginPath();
        ctx.moveTo(
            Math.cos(a - step / 2) * (outer - 12),
            Math.sin(a - step / 2) * (outer - 12)
        );
        ctx.arc(0, 0, outer - 12, a - step / 2, a + step / 2);
        ctx.lineTo(
            Math.cos(a + step / 2) * pocket,
            Math.sin(a + step / 2) * pocket
        );
        ctx.arc(0, 0, pocket, a + step / 2, a - step / 2, true);
        ctx.closePath();

        ctx.fillStyle =
            n === 0 ? "#0b8f43" :
            RED.has(n) ? "#a61f28" :
            "#121212";
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        const tx = Math.cos(a) * ((outer + pocket) / 2);
        const ty = Math.sin(a) * ((outer + pocket) / 2);
        ctx.translate(tx, ty);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = "#f7f1df";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(n), 0, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fillStyle = "#b9852a";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fillStyle = "#12301d";
    ctx.fill();

    ctx.restore();

    // Ball shadow + ball
    const ballR = 177;
    const bx = cx + Math.cos(ballAngle) * ballR;
    const by = cy + Math.sin(ballAngle) * ballR * 0.82;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.65)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 7;

    const ball = ctx.createRadialGradient(
        bx - 4, by - 4, 1,
        bx, by, 11
    );
    ball.addColorStop(0, "#ffffff");
    ball.addColorStop(0.55, "#dddddd");
    ball.addColorStop(1, "#777777");

    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fillStyle = ball;
    ctx.fill();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 28px Arial";
    ctx.fillText("NÉBUL ROULETTE", cx, 35);

    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "15px Arial";
    ctx.fillText(
        t < .72 ? "La bille tourne..." : "La bille ralentit...",
        cx,
        60
    );

    if (t > .92) {
        const alpha = clamp((t - .92) / .08, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle = "rgba(5,5,8,.82)";
        ctx.beginPath();
        ctx.roundRect(cx - 135, 475, 270, 48, 16);
        ctx.fill();

        ctx.strokeStyle = "#d3a84b";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle =
            colorOf(result) === "rouge" ? "#ff5564" :
            colorOf(result) === "noir" ? "#ffffff" :
            "#55f08c";
        ctx.font = "bold 23px Arial";
        ctx.fillText(
            `${result} • ${colorOf(result).toUpperCase()}`,
            cx,
            499
        );
        ctx.restore();
    }

    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(70, 520, w - 140, 4);
    ctx.fillStyle = "#c89a43";
    ctx.fillRect(70, 520, (w - 140) * t, 4);
}

function renderRoulette(result, outputPath, options = {}) {
    const number = validateResult(result);
    const ffmpeg = options.ffmpegPath || FFMPEG_PATH;

    if (!fs.existsSync(ffmpeg)) {
        throw new Error(`FFmpeg introuvable : ${ffmpeg}`);
    }

    const canvas = createCanvas(WIDTH, HEIGHT);
    const totalFrames = Math.round(FPS * DURATION);

    const args = [
        "-y",
        "-f", "image2pipe",
        "-vcodec", "png",
        "-r", String(FPS),
        "-i", "pipe:0",
        "-an",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        outputPath
    ];

    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpeg, args, {
            windowsHide: true,
            stdio: ["pipe", "ignore", "pipe"]
        });

        let stderr = "";
        proc.stderr.on("data", chunk => {
            stderr += chunk.toString();
        });

        proc.on("error", reject);

        proc.on("close", code => {
            if (code === 0) resolve(outputPath);
            else reject(new Error(`FFmpeg roulette ${code}: ${stderr}`));
        });

        try {
            for (let i = 0; i < totalFrames; i++) {
                drawFrame(
                    canvas,
                    number,
                    i,
                    totalFrames
                );
                proc.stdin.write(
                    canvas.toBuffer("image/png")
                );
            }
            proc.stdin.end();
        } catch (error) {
            try { proc.stdin.destroy(); } catch {}
            reject(error);
        }
    });
}

module.exports = {
    WHEEL,
    getColor: colorOf,
    renderRoulette
};
