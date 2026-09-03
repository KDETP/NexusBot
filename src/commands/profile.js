const fs = require("fs");
const path = require("path");
const axios = require("axios");

const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createCanvas,
    loadImage
} = require("canvas");

const {
    GifUtil
} = require("gifwrap");

const GIFEncoder = require("gif-encoder-2");


module.exports = {

    name: "profile",

    async execute(message) {

        try {

            // =========================================================
            // UTILISATEUR
            // =========================================================

            const user = await message.client.users.fetch(
                message.author.id,
                {
                    force: true
                }
            );

            const id = message.author.id;


            // =========================================================
            // FICHIERS
            // =========================================================

            const economyFile = path.join(
                __dirname,
                "..",
                "data",
                "economy.json"
            );

            const profilesFile = path.join(
                __dirname,
                "..",
                "data",
                "profiles.json"
            );


            const economy = JSON.parse(
                fs.readFileSync(
                    economyFile,
                    "utf8"
                )
            );

            const profiles = JSON.parse(
                fs.readFileSync(
                    profilesFile,
                    "utf8"
                )
            );


            // =========================================================
            // CREATION DU PROFIL SI INEXISTANT
            // =========================================================

            if (!economy[id]) {

                economy[id] = {
                    money: 500
                };

                fs.writeFileSync(
                    economyFile,
                    JSON.stringify(
                        economy,
                        null,
                        2
                    )
                );
            }


            if (!profiles[id]) {

                profiles[id] = {

                    level: 1,
                    xp: 0,
                    quiz: 0,
                    work: 0,
                    casino: 0

                };

                fs.writeFileSync(
                    profilesFile,
                    JSON.stringify(
                        profiles,
                        null,
                        2
                    )
                );
            }


            // =========================================================
            // DONNEES
            // =========================================================

            const level =
                profiles[id].level || 1;

            const xp =
                profiles[id].xp || 0;

            const money =
                economy[id].money || 0;

            const quiz =
                profiles[id].quiz || 0;

            const work =
                profiles[id].work || 0;

            const casino =
                profiles[id].casino || 0;


            // IMPORTANT :
            // On garde ton système actuel.
            const xpMax =
                level * 500;


            const xpProgress =
                Math.min(
                    Math.max(
                        xp / xpMax,
                        0
                    ),
                    1
                );


            // =========================================================
            // DIMENSIONS
            // =========================================================

            const WIDTH = 800;
            const HEIGHT = 480;

            const BANNER_HEIGHT = 225;


            // =========================================================
            // TELECHARGEMENT
            // =========================================================

            async function download(url) {

                const response =
                    await axios.get(
                        url,
                        {
                            responseType:
                                "arraybuffer",

                            timeout:
                                15000,

                            maxContentLength:
                                15 * 1024 * 1024,

                            maxBodyLength:
                                15 * 1024 * 1024
                        }
                    );

                return Buffer.from(
                    response.data
                );
            }


            // =========================================================
            // TEST GIF
            // =========================================================

            function isGif(buffer) {

                if (
                    !buffer ||
                    buffer.length < 6
                ) {
                    return false;
                }


                const header =
                    buffer.toString(
                        "ascii",
                        0,
                        6
                    );


                return (
                    header === "GIF87a" ||
                    header === "GIF89a"
                );
            }


            // =========================================================
            // FRAME GIF -> CANVAS
            // =========================================================

            function frameToCanvas(frame) {

                const source =
                    createCanvas(
                        frame.bitmap.width,
                        frame.bitmap.height
                    );


                const sourceCtx =
                    source.getContext("2d");


                const imageData =
                    sourceCtx.createImageData(
                        frame.bitmap.width,
                        frame.bitmap.height
                    );


                imageData.data.set(
                    frame.bitmap.data
                );


                sourceCtx.putImageData(
                    imageData,
                    0,
                    0
                );


                return source;
            }


            // =========================================================
            // DECODAGE GIF
            //
            // On reconstruit chaque frame complète pour éviter les
            // problèmes avec les GIF utilisant des frames partielles.
            // =========================================================

            async function decodeGif(buffer) {

                const gif =
                    await GifUtil.read(
                        buffer
                    );


                const gifWidth =
                    gif.width;

                const gifHeight =
                    gif.height;


                const working =
                    createCanvas(
                        gifWidth,
                        gifHeight
                    );


                const workingCtx =
                    working.getContext("2d");


                workingCtx.clearRect(
                    0,
                    0,
                    gifWidth,
                    gifHeight
                );


                const result = [];


                for (
                    let i = 0;
                    i < gif.frames.length;
                    i++
                ) {

                    const frame =
                        gif.frames[i];


                    // -------------------------------------------------
                    // Sauvegarde pour disposal 3
                    // -------------------------------------------------

                    let previousState =
                        null;


                    if (
                        frame.disposalMethod === 3
                    ) {

                        previousState =
                            workingCtx.getImageData(
                                0,
                                0,
                                gifWidth,
                                gifHeight
                            );
                    }


                    // -------------------------------------------------
                    // Frame actuelle
                    // -------------------------------------------------

                    const frameCanvas =
                        frameToCanvas(
                            frame
                        );


                    workingCtx.drawImage(
                        frameCanvas,
                        frame.xOffset || 0,
                        frame.yOffset || 0
                    );


                    // -------------------------------------------------
                    // Snapshot complet
                    // -------------------------------------------------

                    const completeFrame =
                        workingCtx.getImageData(
                            0,
                            0,
                            gifWidth,
                            gifHeight
                        );


                    result.push({

                        width:
                            gifWidth,

                        height:
                            gifHeight,

                        data:
                            Buffer.from(
                                completeFrame.data
                            ),

                        delay:
                            Math.max(
                                (
                                    frame.delayCentisecs ||
                                    10
                                ) * 10,
                                40
                            )

                    });


                    // -------------------------------------------------
                    // DISPOSAL
                    // -------------------------------------------------

                    if (
                        frame.disposalMethod === 2
                    ) {

                        workingCtx.clearRect(
                            frame.xOffset || 0,
                            frame.yOffset || 0,
                            frame.bitmap.width,
                            frame.bitmap.height
                        );


                    } else if (
                        frame.disposalMethod === 3 &&
                        previousState
                    ) {

                        workingCtx.putImageData(
                            previousState,
                            0,
                            0
                        );
                    }
                }


                return result;
            }


            // =========================================================
            // IMAGE STATIQUE -> FRAME
            // =========================================================

            async function decodeStatic(buffer) {

                const image =
                    await loadImage(
                        buffer
                    );


                const canvas =
                    createCanvas(
                        image.width,
                        image.height
                    );


                const ctx =
                    canvas.getContext("2d");


                ctx.drawImage(
                    image,
                    0,
                    0
                );


                const imageData =
                    ctx.getImageData(
                        0,
                        0,
                        image.width,
                        image.height
                    );


                return [{

                    width:
                        image.width,

                    height:
                        image.height,

                    data:
                        Buffer.from(
                            imageData.data
                        ),

                    delay:
                        100

                }];
            }


            // =========================================================
            // CHARGER UNE SOURCE
            // =========================================================

            async function loadSource(url) {

                if (!url) {
                    return null;
                }


                try {

                    const buffer =
                        await download(
                            url
                        );


                    if (
                        isGif(buffer)
                    ) {

                        const frames =
                            await decodeGif(
                                buffer
                            );


                        if (
                            frames &&
                            frames.length
                        ) {

                            return frames;
                        }
                    }


                    return await decodeStatic(
                        buffer
                    );


                } catch (error) {

                    console.log(
                        "⚠️ Erreur chargement image :",
                        error.message
                    );


                    return null;
                }
            }


            // =========================================================
            // URL AVATAR
            // =========================================================

            const avatarURL =
                user.displayAvatarURL({

                    extension:
                        "gif",

                    size:
                        512,

                    forceStatic:
                        false

                });


            // =========================================================
            // URL BANNIERE
            // =========================================================

            const bannerURL =
                user.bannerURL({

                    extension:
                        "gif",

                    size:
                        1024,

                    forceStatic:
                        false

                });


            // =========================================================
            // CHARGEMENT AVATAR
            // =========================================================

            let avatarFrames =
                await loadSource(
                    avatarURL
                );


            // =========================================================
            // FALLBACK AVATAR
            // =========================================================

            if (
                !avatarFrames ||
                !avatarFrames.length
            ) {

                const fallbackBuffer =
                    await download(
                        user.displayAvatarURL({
                            extension:
                                "png",

                            size:
                                512
                        })
                    );


                avatarFrames =
                    await decodeStatic(
                        fallbackBuffer
                    );
            }


            // =========================================================
            // CHARGEMENT BANNIERE
            // =========================================================

            let bannerFrames =
                await loadSource(
                    bannerURL
                );


            // =========================================================
            // DUREE D'UNE ANIMATION
            // =========================================================

            function getDuration(
                frames
            ) {

                if (
                    !frames ||
                    !frames.length
                ) {

                    return 100;
                }


                return frames.reduce(
                    (
                        total,
                        frame
                    ) => {

                        return (
                            total +
                            frame.delay
                        );

                    },
                    0
                );
            }


            const avatarDuration =
                getDuration(
                    avatarFrames
                );


            const bannerDuration =
                getDuration(
                    bannerFrames
                );


            // =========================================================
            // ANIMATION
            //
            // Maximum 2 secondes.
            // Cela évite de générer des GIF énormes.
            // =========================================================

            const duration =
                Math.min(
                    Math.max(
                        avatarDuration,
                        bannerDuration,
                        1000
                    ),
                    2000
                );


            // =========================================================
            // FPS
            // =========================================================

            const FPS = 10;

            const FRAME_DELAY =
                100;


            const frameCount =
                Math.max(
                    1,
                    Math.ceil(
                        duration /
                        FRAME_DELAY
                    )
                );


            // =========================================================
            // TROUVER UNE FRAME SELON LE TEMPS
            // =========================================================

            function frameAtTime(
                frames,
                time
            ) {

                if (
                    !frames ||
                    !frames.length
                ) {

                    return null;
                }


                const totalDuration =
                    getDuration(
                        frames
                    );


                if (
                    totalDuration <= 0
                ) {

                    return frames[0];
                }


                let current =
                    time %
                    totalDuration;


                for (
                    const frame of frames
                ) {

                    if (
                        current <
                        frame.delay
                    ) {

                        return frame;
                    }


                    current -=
                        frame.delay;
                }


                return frames[
                    frames.length - 1
                ];
            }


            // =========================================================
            // FRAME -> CANVAS
            // =========================================================

            function sourceToCanvas(
                frame
            ) {

                if (!frame) {
                    return null;
                }


                const source =
                    createCanvas(
                        frame.width,
                        frame.height
                    );


                const sourceCtx =
                    source.getContext("2d");


                const imageData =
                    sourceCtx.createImageData(
                        frame.width,
                        frame.height
                    );


                imageData.data.set(
                    frame.data
                );


                sourceCtx.putImageData(
                    imageData,
                    0,
                    0
                );


                return source;
            }


            // =========================================================
            // IMAGE COVER
            // =========================================================

            function drawCover(
                ctx,
                image,
                x,
                y,
                width,
                height
            ) {

                if (!image) {
                    return;
                }


                const scale =
                    Math.max(
                        width /
                            image.width,

                        height /
                            image.height
                    );


                const drawWidth =
                    image.width *
                    scale;


                const drawHeight =
                    image.height *
                    scale;


                const drawX =
                    x +
                    (
                        width -
                        drawWidth
                    ) / 2;


                const drawY =
                    y +
                    (
                        height -
                        drawHeight
                    ) / 2;


                ctx.drawImage(
                    image,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );
            }


            // =========================================================
            // ROUNDED RECT
            // =========================================================

            function roundedRect(
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

                ctx.closePath();
            }


            // =========================================================
            // ICON : COIN
            // =========================================================

            function drawCoin(
                ctx,
                x,
                y
            ) {

                ctx.save();

                ctx.strokeStyle =
                    "#C4B5FD";

                ctx.lineWidth = 2.5;


                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    12,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    6,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();


                ctx.restore();
            }


            // =========================================================
            // ICON : TROPHÉE
            // =========================================================

            function drawTrophy(
                ctx,
                x,
                y
            ) {

                ctx.save();

                ctx.strokeStyle =
                    "#C4B5FD";

                ctx.lineWidth = 2.5;


                ctx.beginPath();

                ctx.roundRect(
                    x - 8,
                    y - 11,
                    16,
                    14,
                    3
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    x,
                    y + 3
                );

                ctx.lineTo(
                    x,
                    y + 10
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    x - 7,
                    y + 11
                );

                ctx.lineTo(
                    x + 7,
                    y + 11
                );

                ctx.stroke();


                ctx.restore();
            }


            // =========================================================
            // ICON : TRAVAIL
            // =========================================================

            function drawBriefcase(
                ctx,
                x,
                y
            ) {

                ctx.save();

                ctx.strokeStyle =
                    "#C4B5FD";

                ctx.lineWidth = 2.5;


                ctx.beginPath();

                ctx.roundRect(
                    x - 13,
                    y - 6,
                    26,
                    17,
                    4
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.roundRect(
                    x - 7,
                    y - 12,
                    14,
                    7,
                    2
                );

                ctx.stroke();


                ctx.beginPath();

                ctx.moveTo(
                    x - 13,
                    y
                );

                ctx.lineTo(
                    x + 13,
                    y
                );

                ctx.stroke();


                ctx.restore();
            }


            // =========================================================
            // ICON : DÉS
            // =========================================================

            function drawDice(
                ctx,
                x,
                y
            ) {

                ctx.save();

                ctx.strokeStyle =
                    "#C4B5FD";

                ctx.lineWidth = 2.5;


                ctx.beginPath();

                ctx.roundRect(
                    x - 12,
                    y - 12,
                    24,
                    24,
                    5
                );

                ctx.stroke();


                ctx.fillStyle =
                    "#C4B5FD";


                const dots = [

                    [-5, -5],
                    [5, 5],
                    [0, 0]

                ];


                for (
                    const dot of dots
                ) {

                    ctx.beginPath();

                    ctx.arc(
                        x + dot[0],
                        y + dot[1],
                        2.2,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();
                }


                ctx.restore();
            }


            // =========================================================
            // CANVAS
            // =========================================================

            const canvas =
                createCanvas(
                    WIDTH,
                    HEIGHT
                );


            const ctx =
                canvas.getContext("2d");


            // =========================================================
            // ENCODEUR GIF
            //
            // IMPORTANT :
            // On encode les frames directement.
            // Elles ne sont PAS stockées dans un gros tableau.
            // =========================================================

            const encoder =
                new GIFEncoder(
                    WIDTH,
                    HEIGHT,
                    "octree",
                    false
                );


            encoder.start();

            encoder.setRepeat(0);

            encoder.setDelay(
                FRAME_DELAY
            );

            encoder.setQuality(10);


            // =========================================================
            // GENERATION DES FRAMES
            // =========================================================

            for (
                let i = 0;
                i < frameCount;
                i++
            ) {

                const time =
                    i *
                    FRAME_DELAY;


                // =====================================================
                // RESET
                // =====================================================

                ctx.clearRect(
                    0,
                    0,
                    WIDTH,
                    HEIGHT
                );


                // =====================================================
                // FOND
                // =====================================================

                const background =
                    ctx.createLinearGradient(
                        0,
                        0,
                        WIDTH,
                        HEIGHT
                    );


                background.addColorStop(
                    0,
                    "#09050F"
                );

                background.addColorStop(
                    0.45,
                    "#1A0B2A"
                );

                background.addColorStop(
                    1,
                    "#060309"
                );


                ctx.fillStyle =
                    background;


                ctx.fillRect(
                    0,
                    0,
                    WIDTH,
                    HEIGHT
                );


                // =====================================================
                // BANNIERE
                // =====================================================

                const bannerFrame =
                    frameAtTime(
                        bannerFrames,
                        time
                    );


                if (bannerFrame) {

                    const bannerCanvas =
                        sourceToCanvas(
                            bannerFrame
                        );


                    ctx.save();


                    roundedRect(
                        ctx,
                        0,
                        0,
                        WIDTH,
                        BANNER_HEIGHT,
                        26
                    );


                    ctx.clip();


                    drawCover(
                        ctx,
                        bannerCanvas,
                        0,
                        0,
                        WIDTH,
                        BANNER_HEIGHT
                    );


                    // -------------------------------------------------
                    // OVERLAY
                    // -------------------------------------------------

                    const overlay =
                        ctx.createLinearGradient(
                            0,
                            0,
                            0,
                            BANNER_HEIGHT
                        );


                    overlay.addColorStop(
                        0,
                        "rgba(5,2,12,0.08)"
                    );

                    overlay.addColorStop(
                        0.55,
                        "rgba(5,2,12,0.22)"
                    );

                    overlay.addColorStop(
                        1,
                        "rgba(5,2,12,0.96)"
                    );


                    ctx.fillStyle =
                        overlay;


                    ctx.fillRect(
                        0,
                        0,
                        WIDTH,
                        BANNER_HEIGHT
                    );


                    ctx.restore();


                } else {

                    // -------------------------------------------------
                    // BANNIERE PAR DEFAUT
                    // -------------------------------------------------

                    const defaultBanner =
                        ctx.createLinearGradient(
                            0,
                            0,
                            WIDTH,
                            BANNER_HEIGHT
                        );


                    defaultBanner.addColorStop(
                        0,
                        "#7C3AED"
                    );

                    defaultBanner.addColorStop(
                        0.5,
                        "#4C1D95"
                    );

                    defaultBanner.addColorStop(
                        1,
                        "#16091F"
                    );


                    ctx.fillStyle =
                        defaultBanner;


                    ctx.fillRect(
                        0,
                        0,
                        WIDTH,
                        BANNER_HEIGHT
                    );
                }


                // =====================================================
                // GLOW
                // =====================================================

                const glow =
                    ctx.createRadialGradient(
                        400,
                        220,
                        20,
                        400,
                        220,
                        430
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


                // =====================================================
                // AVATAR
                // =====================================================

                const avatarFrame =
                    frameAtTime(
                        avatarFrames,
                        time
                    );


                const avatarCanvas =
                    sourceToCanvas(
                        avatarFrame
                    );


                const avatarSize = 125;

                const avatarX = 55;

                const avatarY = 170;


                // -----------------------------------------------------
                // HALO
                // -----------------------------------------------------

                ctx.save();

                ctx.shadowColor =
                    "#8B5CF6";

                ctx.shadowBlur =
                    28;


                ctx.beginPath();

                ctx.arc(
                    avatarX +
                        avatarSize / 2,

                    avatarY +
                        avatarSize / 2,

                    avatarSize / 2 + 7,

                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    "#8B5CF6";

                ctx.fill();

                ctx.restore();


                // -----------------------------------------------------
                // CONTOUR
                // -----------------------------------------------------

                ctx.beginPath();

                ctx.arc(
                    avatarX +
                        avatarSize / 2,

                    avatarY +
                        avatarSize / 2,

                    avatarSize / 2 + 5,

                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    "#0B0612";

                ctx.fill();


                // -----------------------------------------------------
                // AVATAR
                // -----------------------------------------------------

                ctx.save();


                ctx.beginPath();

                ctx.arc(
                    avatarX +
                        avatarSize / 2,

                    avatarY +
                        avatarSize / 2,

                    avatarSize / 2,

                    0,
                    Math.PI * 2
                );


                ctx.clip();


                drawCover(
                    ctx,
                    avatarCanvas,
                    avatarX,
                    avatarY,
                    avatarSize,
                    avatarSize
                );


                ctx.restore();


                // =====================================================
                // NOM
                // =====================================================

                ctx.font =
                    "700 32px Arial";

                ctx.fillStyle =
                    "#FFFFFF";


                ctx.fillText(
                    user.username,
                    215,
                    203
                );


                // =====================================================
                // HANDLE
                // =====================================================

                ctx.font =
                    "16px Arial";

                ctx.fillStyle =
                    "rgba(255,255,255,0.48)";


                ctx.fillText(
                    `@${user.username}`,
                    217,
                    230
                );


                // =====================================================
                // BADGE NIVEAU
                // =====================================================

                roundedRect(
                    ctx,
                    215,
                    250,
                    125,
                    36,
                    18
                );


                ctx.fillStyle =
                    "rgba(139,92,246,0.24)";

                ctx.fill();


                ctx.strokeStyle =
                    "rgba(196,181,253,0.24)";

                ctx.lineWidth = 1;

                ctx.stroke();


                ctx.font =
                    "700 14px Arial";

                ctx.fillStyle =
                    "#DDD6FE";


                ctx.fillText(
                    `NIVEAU ${level}`,
                    235,
                    273
                );


                // =====================================================
                // XP
                // =====================================================

                ctx.font =
                    "15px Arial";

                ctx.fillStyle =
                    "rgba(255,255,255,0.65)";


                ctx.fillText(
                    `${xp.toLocaleString("fr-FR")} / ${xpMax.toLocaleString("fr-FR")} XP`,
                    365,
                    273
                );


                // =====================================================
                // PANEL PRINCIPAL
                // =====================================================

                roundedRect(
                    ctx,
                    40,
                    320,
                    720,
                    125,
                    22
                );


                ctx.fillStyle =
                    "rgba(255,255,255,0.045)";

                ctx.fill();


                ctx.strokeStyle =
                    "rgba(255,255,255,0.075)";

                ctx.lineWidth = 1;

                ctx.stroke();


                // =====================================================
                // TITRE PROGRESSION
                // =====================================================

                ctx.font =
                    "700 14px Arial";

                ctx.fillStyle =
                    "#EDE9FE";


                ctx.fillText(
                    "PROGRESSION",
                    65,
                    347
                );


                // =====================================================
                // POURCENTAGE
                // =====================================================

                ctx.textAlign =
                    "right";


                ctx.fillStyle =
                    "#A78BFA";


                ctx.fillText(
                    `${Math.round(
                        xpProgress * 100
                    )}%`,
                    735,
                    347
                );


                ctx.textAlign =
                    "left";


                // =====================================================
                // BARRE XP
                // =====================================================

                const barX = 65;

                const barY = 362;

                const barWidth = 670;

                const barHeight = 12;


                roundedRect(
                    ctx,
                    barX,
                    barY,
                    barWidth,
                    barHeight,
                    6
                );


                ctx.fillStyle =
                    "rgba(255,255,255,0.08)";

                ctx.fill();


                if (
                    xpProgress > 0
                ) {

                    const progressWidth =
                        Math.max(
                            barHeight,
                            barWidth *
                                xpProgress
                        );


                    const progressGradient =
                        ctx.createLinearGradient(
                            barX,
                            0,
                            barX +
                                barWidth,
                            0
                        );


                    progressGradient.addColorStop(
                        0,
                        "#7C3AED"
                    );

                    progressGradient.addColorStop(
                        0.5,
                        "#A855F7"
                    );

                    progressGradient.addColorStop(
                        1,
                        "#C084FC"
                    );


                    roundedRect(
                        ctx,
                        barX,
                        barY,
                        progressWidth,
                        barHeight,
                        6
                    );


                    ctx.fillStyle =
                        progressGradient;

                    ctx.fill();
                }


                // =====================================================
                // SEPARATEUR
                // =====================================================

                ctx.strokeStyle =
                    "rgba(255,255,255,0.07)";

                ctx.lineWidth = 1;


                ctx.beginPath();

                ctx.moveTo(
                    65,
                    390
                );

                ctx.lineTo(
                    735,
                    390
                );

                ctx.stroke();


                // =====================================================
                // STATISTIQUES
                // =====================================================

                const stats = [

                    {
                        icon:
                            drawCoin,

                        value:
                            money,

                        label:
                            "NEBUCOINS"
                    },

                    {
                        icon:
                            drawTrophy,

                        value:
                            quiz,

                        label:
                            "QUIZ GAGNÉS"
                    },

                    {
                        icon:
                            drawBriefcase,

                        value:
                            work,

                        label:
                            "TRAVAUX"
                    },

                    {
                        icon:
                            drawDice,

                        value:
                            casino,

                        label:
                            "CASINO"
                    }

                ];


                const positions = [

                    105,
                    285,
                    465,
                    645

                ];


                stats.forEach(
                    (
                        stat,
                        index
                    ) => {

                        const x =
                            positions[index];


                        // Icon
                        stat.icon(
                            ctx,
                            x,
                            413
                        );


                        // Valeur
                        ctx.font =
                            "700 18px Arial";

                        ctx.fillStyle =
                            "#FFFFFF";


                        ctx.fillText(
                            String(
                                stat.value
                            ),
                            x + 22,
                            418
                        );


                        // Label
                        ctx.font =
                            "10px Arial";

                        ctx.fillStyle =
                            "rgba(255,255,255,0.40)";


                        ctx.fillText(
                            stat.label,
                            x - 12,
                            433
                        );
                    }
                );


                // =====================================================
                // FOOTER
                // =====================================================

                ctx.font =
                    "600 10px Arial";

                ctx.fillStyle =
                    "rgba(255,255,255,0.25)";


                ctx.fillText(
                    "NÉBULAE  •  PROFILE SYSTEM",
                    65,
                    465
                );


                ctx.textAlign =
                    "right";


                ctx.fillText(
                    "NEBULA",
                    735,
                    465
                );


                ctx.textAlign =
                    "left";


                // =====================================================
                // ENCODAGE DIRECT
                //
                // IMPORTANT :
                // Une frame est envoyée directement à l'encodeur.
                // Elle n'est pas ajoutée à un tableau.
                // =====================================================

                encoder.addFrame(
                    ctx
                );
            }


            // =========================================================
            // FIN DE L'ENCODAGE
            // =========================================================

            encoder.finish();


            const buffer =
                encoder.out.getData();


            // =========================================================
            // LOG
            // =========================================================

            console.log(
                `📸 Profil GIF généré : ${
                    Math.round(
                        buffer.length / 1024
                    )
                } KB`
            );


            // =========================================================
            // ATTACHMENT
            // =========================================================

            const attachment =
                new AttachmentBuilder(
                    buffer,
                    {
                        name:
                            "profile.gif"
                    }
                );


            // =========================================================
            // EMBED
            // =========================================================

            const embed =
                new EmbedBuilder()

                    .setColor(
                        "#8B5CF6"
                    )

                    .setImage(
                        "attachment://profile.gif"
                    )

                    .setFooter({
                        text:
                            "Nébula • Profil"
                    })

                    .setTimestamp();


            // =========================================================
            // ENVOI
            // =========================================================

            return message.reply({

                embeds: [
                    embed
                ],

                files: [
                    attachment
                ]

            });


        } catch (error) {

            console.error(
                "❌ Erreur nprofile :",
                error
            );


            return message.reply(
                "❌ Impossible de générer ton profil pour le moment."
            );
        }
    }
};