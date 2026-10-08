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



    async execute(message, args) {



        try {



            // =========================================================

            // UTILISATEUR

            // =========================================================



            
            // =========================================================
            // UTILISATEUR CIBLE
            // =========================================================
            //
            // nprofile
            // nprofile @user
            // nprofile ID
            //
            // Mention > ID > auteur de la commande
            // =========================================================

            const mentionUser =
                message.mentions.users.first();

            let targetId;

            if (mentionUser) {

                targetId =
                    mentionUser.id;

            } else if (
                args &&
                args.length
            ) {

                const rawId =
                    String(args[0])
                        .replace(/[<@!>]/g, "");

                if (
                    !/^\d{17,20}$/.test(rawId)
                ) {

                    return message.reply(
                        "❌ Utilisateur invalide. Utilise `nprofile`, `nprofile @user` ou `nprofile ID`."
                    );

                }

                targetId = rawId;

            } else {

                targetId =
                    message.author.id;

            }

            let user;

            try {

                user =
                    await message.client.users.fetch(
                        targetId,
                        {
                            force: true
                        }
                    );

            } catch (error) {

                console.error(
                    "❌ Impossible de récupérer l'utilisateur du profil :",
                    error
                );

                return message.reply(
                    "❌ Impossible de trouver cet utilisateur."
                );

            }

            const id =
                user.id;


            // =========================================================
            // PSEUDO DU SERVEUR
            // =========================================================
            //
            // On affiche le pseudo/nickname du serveur en premier.
            // En dessous, on affiche le username réel du compte Discord.
            // Si l'utilisateur n'est plus sur le serveur, on retombe
            // automatiquement sur son username.
            // =========================================================

            let targetMember = null;

            try {

                targetMember =
                    await message.guild.members.fetch(id);

            } catch {

                targetMember = null;

            }

            const serverName =
                targetMember
                    ? targetMember.displayName
                    : user.username;





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

            // =========================================================
            // PROFIL VISUEL — STYLE GAMING / ANIME
            // =========================================================

            const WIDTH = 800;
            const HEIGHT = 480;

            const canvas = createCanvas(WIDTH, HEIGHT);
            const ctx = canvas.getContext("2d");

            function clamp(value, min, max) {
                return Math.max(min, Math.min(max, value));
            }

            function roundRectFill(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, r);
                ctx.fillStyle = fill;
                ctx.fill();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                }
            }

            function drawText(ctx, text, x, y, font, color, align = "left") {
                ctx.font = font;
                ctx.fillStyle = color;
                ctx.textAlign = align;
                ctx.textBaseline = "middle";
                ctx.fillText(text, x, y);
            }

            function drawStatCard(ctx, x, y, w, h, label, value, accent, icon) {
                roundRectFill(
                    ctx,
                    x, y, w, h, 15,
                    "rgba(4, 7, 16, 0.68)",
                    "rgba(255,255,255,0.10)",
                    1
                );

                ctx.save();
                ctx.shadowColor = accent;
                ctx.shadowBlur = 10;
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(x + 24, y + h / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                drawText(ctx, icon, x + 24, y + h / 2 + 1, "bold 11px Arial", "#090A12", "center");
                drawText(ctx, label.toUpperCase(), x + 47, y + 17, "600 9px Arial", "rgba(255,255,255,0.42)");
                drawText(ctx, String(value), x + 47, y + 38, "700 18px Arial", "#FFFFFF");
            }

            function drawProgressBar(ctx, x, y, w, h, progress) {
                roundRectFill(ctx, x, y, w, h, h / 2, "rgba(255,255,255,0.09)");

                const fillW = Math.max(8, w * progress);
                const gradient = ctx.createLinearGradient(x, y, x + w, y);
                gradient.addColorStop(0, "#EC4899");
                gradient.addColorStop(0.5, "#A855F7");
                gradient.addColorStop(1, "#6366F1");

                roundRectFill(ctx, x, y, fillW, h, h / 2, gradient);
            }

            function drawParticles(ctx, time) {
                const particles = [
                    [92, 38, 2], [156, 92, 1], [232, 27, 2], [315, 74, 1],
                    [404, 42, 2], [512, 94, 1], [612, 40, 2], [704, 86, 1],
                    [757, 151, 2], [55, 205, 1], [144, 282, 2], [286, 234, 1],
                    [474, 205, 2], [604, 266, 1], [745, 292, 2]
                ];

                ctx.save();
                for (let i = 0; i < particles.length; i++) {
                    const [px, py, radius] = particles[i];
                    const pulse = 0.35 + ((Math.sin(time / 220 + i) + 1) / 2) * 0.65;
                    ctx.globalAlpha = pulse * 0.65;
                    ctx.fillStyle = i % 3 === 0 ? "#F472B6" : i % 3 === 1 ? "#A78BFA" : "#FFFFFF";
                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            const encoder = new GIFEncoder(
                WIDTH,
                HEIGHT,
                "octree",
                false
            );

            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(FRAME_DELAY);
            encoder.setQuality(10);

            for (let i = 0; i < frameCount; i++) {
                const time = i * FRAME_DELAY;

                ctx.clearRect(0, 0, WIDTH, HEIGHT);

                // ---------------------------------------------------------
                // FOND / BANNIÈRE
                // ---------------------------------------------------------

                const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
                background.addColorStop(0, "#080A12");
                background.addColorStop(0.5, "#111323");
                background.addColorStop(1, "#05060B");
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                const bannerFrame = frameAtTime(bannerFrames, time);
                if (bannerFrame) {
                    const bannerCanvas = sourceToCanvas(bannerFrame);
                    ctx.save();
                    ctx.globalAlpha = 0.88;
                    drawCover(ctx, bannerCanvas, 0, 0, WIDTH, 275);
                    ctx.restore();

                    const dark = ctx.createLinearGradient(0, 0, 0, 320);
                    dark.addColorStop(0, "rgba(2,3,8,0.18)");
                    dark.addColorStop(0.45, "rgba(3,4,10,0.30)");
                    dark.addColorStop(1, "rgba(3,4,10,0.98)");
                    ctx.fillStyle = dark;
                    ctx.fillRect(0, 0, WIDTH, 330);
                }

                // Subtle animated glow
                const glowX = 410 + Math.sin(time / 600) * 80;
                const glow = ctx.createRadialGradient(glowX, 160, 10, glowX, 160, 330);
                glow.addColorStop(0, "rgba(236,72,153,0.16)");
                glow.addColorStop(0.5, "rgba(139,92,246,0.08)");
                glow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);

                drawParticles(ctx, time);

                // ---------------------------------------------------------
                // CADRE EXTÉRIEUR
                // ---------------------------------------------------------

                ctx.strokeStyle = "rgba(244,114,182,0.90)";
                ctx.lineWidth = 3;
                ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

                ctx.strokeStyle = "rgba(255,255,255,0.12)";
                ctx.lineWidth = 1;
                ctx.strokeRect(11, 11, WIDTH - 22, HEIGHT - 22);

                // ---------------------------------------------------------
                // AVATAR
                // ---------------------------------------------------------

                const avatarFrame = frameAtTime(avatarFrames, time);
                const avatarCanvas = sourceToCanvas(avatarFrame);
                const avatarSize = 112;
                const avatarX = 42;
                const avatarY = 42;
                const centerX = avatarX + avatarSize / 2;
                const centerY = avatarY + avatarSize / 2;

                ctx.save();
                ctx.shadowColor = "rgba(236,72,153,0.85)";
                ctx.shadowBlur = 24;
                ctx.strokeStyle = "#EC4899";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2 + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.setLineDash([8, 8]);
                ctx.strokeStyle = "rgba(244,114,182,0.80)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2 + 16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
                ctx.clip();
                drawCover(ctx, avatarCanvas, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                // ---------------------------------------------------------
                // IDENTITÉ
                // ---------------------------------------------------------

                drawText(
                    ctx,
                    `.${serverName}`,
                    178,
                    79,
                    "700 30px Arial",
                    "#F9A8D4"
                );

                drawText(
                    ctx,
                    `@${user.username}`,
                    180,
                    108,
                    "500 13px Arial",
                    "rgba(255,255,255,0.48)"
                );

                roundRectFill(
                    ctx,
                    178, 126, 112, 30, 15,
                    "rgba(236,72,153,0.22)",
                    "rgba(236,72,153,0.65)",
                    1
                );
                drawText(ctx, "MEMBRE NÉBULAE", 234, 141, "700 9px Arial", "#FBCFE8", "center");

                // ---------------------------------------------------------
                // NIVEAU + XP
                // ---------------------------------------------------------

                drawText(ctx, "NIVEAU", 325, 83, "600 9px Arial", "rgba(255,255,255,0.42)");
                drawText(ctx, String(level), 385, 83, "700 29px Arial", "#FFFFFF");

                drawText(
                    ctx,
                    `${xp.toLocaleString("fr-FR")} / ${xpMax.toLocaleString("fr-FR")} XP`,
                    325,
                    109,
                    "500 11px Arial",
                    "rgba(255,255,255,0.58)"
                );

                drawProgressBar(ctx, 325, 123, 260, 9, xpProgress);
                drawText(ctx, `${Math.round(xpProgress * 100)}%`, 595, 128, "700 10px Arial", "#F9A8D4", "right");

                // ---------------------------------------------------------
                // PANNEAU STATS
                // ---------------------------------------------------------

                roundRectFill(
                    ctx,
                    26, 190, 748, 258, 22,
                    "rgba(3,5,12,0.72)",
                    "rgba(255,255,255,0.11)",
                    1
                );

                drawText(ctx, "STATISTIQUES", 50, 215, "700 11px Arial", "rgba(255,255,255,0.46)");
                drawText(ctx, `ID • ${id}`, 750, 215, "500 9px Arial", "rgba(255,255,255,0.25)", "right");

                // ---------------------------------------------------------
                // CARTES
                // ---------------------------------------------------------

                drawStatCard(ctx, 48, 235, 210, 68, "NebuCoins", money.toLocaleString("fr-FR"), "#FBBF24", "$");
                drawStatCard(ctx, 272, 235, 210, 68, "Quiz gagnés", quiz, "#A78BFA", "Q");
                drawStatCard(ctx, 496, 235, 210, 68, "Travaux", work, "#38BDF8", "W");

                drawStatCard(ctx, 48, 317, 210, 68, "Casino", casino, "#F472B6", "C");
                drawStatCard(ctx, 272, 317, 210, 68, "XP total", ((level - 1) * 500 + xp).toLocaleString("fr-FR"), "#8B5CF6", "X");
                drawStatCard(ctx, 496, 317, 210, 68, "Progression", `${Math.round(xpProgress * 100)}%`, "#EC4899", "%");

                // ---------------------------------------------------------
                // BARRE XP BASSE
                // ---------------------------------------------------------

                drawText(ctx, "PROGRESSION VERS LE PROCHAIN NIVEAU", 50, 411, "600 9px Arial", "rgba(255,255,255,0.35)");
                drawText(ctx, `${xp.toLocaleString("fr-FR")} / ${xpMax.toLocaleString("fr-FR")}`, 750, 411, "600 9px Arial", "rgba(255,255,255,0.35)", "right");
                drawProgressBar(ctx, 50, 423, 700, 8, xpProgress);

                // ---------------------------------------------------------
                // COINS / FOOTER
                // ---------------------------------------------------------

                drawText(ctx, "NÉBULAE • PROFILE SYSTEM", 50, 461, "600 9px Arial", "rgba(255,255,255,0.24)");
                drawText(ctx, `LEVEL ${level}`, 750, 461, "700 9px Arial", "rgba(244,114,182,0.62)", "right");

                encoder.addFrame(ctx);
            }

            encoder.finish();

            const buffer = encoder.out.getData();

            console.log(
                `📸 Profil GIF généré : ${Math.round(buffer.length / 1024)} KB`
            );

            const attachment = new AttachmentBuilder(
                buffer,
                {
                    name: "profile.gif"
                }
            );

            const embed = new EmbedBuilder()
                .setColor("#EC4899")
                .setImage("attachment://profile.gif")
                .setFooter({
                    text: "Nébulae • Profil"
                })
                .setTimestamp();

            return message.reply({
                embeds: [embed],
                files: [attachment]
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