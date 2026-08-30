const {
    createCanvas,
    loadImage
} = require("canvas");

const axios = require("axios");


// ======================================================
// RÉCUPÉRATION AVATAR
// ======================================================

async function getAvatar(user) {

    const url =
        user.displayAvatarURL({
            extension: "png",
            size: 1024
        });

    const response =
        await axios.get(
            url,
            {
                responseType: "arraybuffer"
            }
        );

    return loadImage(
        response.data
    );
}


// ======================================================
// EFFET EXPLODE
// ======================================================

function applyExplodeEffect(
    sourceCanvas,
    outputCanvas
) {

    const width =
        sourceCanvas.width;

    const height =
        sourceCanvas.height;

    const sourceCtx =
        sourceCanvas.getContext("2d");

    const outputCtx =
        outputCanvas.getContext("2d");


    const source =
        sourceCtx.getImageData(
            0,
            0,
            width,
            height
        );

    const output =
        outputCtx.createImageData(
            width,
            height
        );


    const src =
        source.data;

    const dst =
        output.data;


    const centerX =
        width / 2;

    const centerY =
        height / 2;


    // ==========================================
    // FORCE DE L'EXPLOSION
    // ==========================================

    const strength =
        1.20;


    // ==========================================
    // DÉFORMATION
    // ==========================================

    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const dx =
                x - centerX;

            const dy =
                y - centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            // Centre
            if (distance === 0) {

                const index =
                    (
                        Math.floor(centerY) *
                        width +
                        Math.floor(centerX)
                    ) * 4;

                const destination =
                    (
                        y *
                        width +
                        x
                    ) * 4;


                dst[destination] =
                    src[index];

                dst[destination + 1] =
                    src[index + 1];

                dst[destination + 2] =
                    src[index + 2];

                dst[destination + 3] =
                    src[index + 3];

                continue;
            }


            const angle =
                Math.atan2(
                    dy,
                    dx
                );


            // Distance maximale dans cette direction
            const cos =
                Math.abs(
                    Math.cos(angle)
                );

            const sin =
                Math.abs(
                    Math.sin(angle)
                );


            const maxRadius =
                Math.min(
                    centerX / (cos || 0.0001),
                    centerY / (sin || 0.0001)
                );


            const normalized =
                Math.min(
                    distance / maxRadius,
                    1
                );


            // ==================================
            // FORCE
            // ==================================

            const amount =
                strength *
                Math.pow(
                    1 - normalized,
                    2
                );


            // ==================================
            // EXPLOSION
            // ==================================

            const sourceDistance =
                distance *
                (1 - amount);


            const sourceX =
                Math.round(
                    centerX +
                    Math.cos(angle) *
                    sourceDistance
                );


            const sourceY =
                Math.round(
                    centerY +
                    Math.sin(angle) *
                    sourceDistance
                );


            if (
                sourceX >= 0 &&
                sourceX < width &&
                sourceY >= 0 &&
                sourceY < height
            ) {

                const sourceIndex =
                    (
                        sourceY *
                        width +
                        sourceX
                    ) * 4;


                const destinationIndex =
                    (
                        y *
                        width +
                        x
                    ) * 4;


                dst[destinationIndex] =
                    src[sourceIndex];

                dst[destinationIndex + 1] =
                    src[sourceIndex + 1];

                dst[destinationIndex + 2] =
                    src[sourceIndex + 2];

                dst[destinationIndex + 3] =
                    src[sourceIndex + 3];
            }
        }
    }


    outputCtx.putImageData(
        output,
        0,
        0
    );
}


// ======================================================
// EFFET IMPLODE
// ======================================================

function applyImplodeEffect(
    sourceCanvas,
    outputCanvas
) {

    const width =
        sourceCanvas.width;

    const height =
        sourceCanvas.height;

    const sourceCtx =
        sourceCanvas.getContext("2d");

    const outputCtx =
        outputCanvas.getContext("2d");


    const source =
        sourceCtx.getImageData(
            0,
            0,
            width,
            height
        );

    const output =
        outputCtx.createImageData(
            width,
            height
        );


    const src =
        source.data;

    const dst =
        output.data;


    const centerX =
        width / 2;

    const centerY =
        height / 2;


    // ==========================================
    // FORCE DE L'IMPLOSION
    // ==========================================

    const strength =
        1.20;


    // ==========================================
    // DÉFORMATION
    // ==========================================

    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const dx =
                x - centerX;

            const dy =
                y - centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            // Centre
            if (distance === 0) {

                const index =
                    (
                        Math.floor(centerY) *
                        width +
                        Math.floor(centerX)
                    ) * 4;


                const destination =
                    (
                        y *
                        width +
                        x
                    ) * 4;


                dst[destination] =
                    src[index];

                dst[destination + 1] =
                    src[index + 1];

                dst[destination + 2] =
                    src[index + 2];

                dst[destination + 3] =
                    src[index + 3];

                continue;
            }


            const angle =
                Math.atan2(
                    dy,
                    dx
                );


            // Distance maximale dans cette direction
            const cos =
                Math.abs(
                    Math.cos(angle)
                );

            const sin =
                Math.abs(
                    Math.sin(angle)
                );


            const maxRadius =
                Math.min(
                    centerX / (cos || 0.0001),
                    centerY / (sin || 0.0001)
                );


            const normalized =
                Math.min(
                    distance / maxRadius,
                    1
                );


            // ==================================
            // FORCE
            // ==================================

            const amount =
                strength *
                Math.pow(
                    1 - normalized,
                    2
                );


            // ==================================
            // IMPLOSION
            // ==================================

            const sourceDistance =
                distance *
                (1 + amount);


            const sourceX =
                Math.round(
                    centerX +
                    Math.cos(angle) *
                    sourceDistance
                );


            const sourceY =
                Math.round(
                    centerY +
                    Math.sin(angle) *
                    sourceDistance
                );


            if (
                sourceX >= 0 &&
                sourceX < width &&
                sourceY >= 0 &&
                sourceY < height
            ) {

                const sourceIndex =
                    (
                        sourceY *
                        width +
                        sourceX
                    ) * 4;


                const destinationIndex =
                    (
                        y *
                        width +
                        x
                    ) * 4;


                dst[destinationIndex] =
                    src[sourceIndex];

                dst[destinationIndex + 1] =
                    src[sourceIndex + 1];

                dst[destinationIndex + 2] =
                    src[sourceIndex + 2];

                dst[destinationIndex + 3] =
                    src[sourceIndex + 3];
            }
        }
    }


    outputCtx.putImageData(
        output,
        0,
        0
    );
}


// ======================================================
// CRÉATION IMAGE
// ======================================================

async function createImage(
    effect,
    user
) {

    const avatar =
        await getAvatar(
            user
        );


    const canvas =
        createCanvas(
            1024,
            1024
        );


    const ctx =
        canvas.getContext(
            "2d"
        );


    // ==================================================
    // BLUR
    // ==================================================

    if (effect === "blur") {

        ctx.filter =
            "blur(15px)";

        ctx.drawImage(
            avatar,
            0,
            0,
            1024,
            1024
        );
    }


    // ==================================================
    // EXPLODE
    // ==================================================

    else if (effect === "explode") {

        const sourceCanvas =
            createCanvas(
                1024,
                1024
            );


        const sourceCtx =
            sourceCanvas.getContext(
                "2d"
            );


        sourceCtx.drawImage(
            avatar,
            0,
            0,
            1024,
            1024
        );


        applyExplodeEffect(
            sourceCanvas,
            canvas
        );
    }


    // ==================================================
    // TRIGGERED
    // ==================================================

    else if (effect === "triggered") {

        ctx.drawImage(
            avatar,
            0,
            0,
            1024,
            1024
        );


        ctx.fillStyle =
            "rgba(255,0,0,0.35)";


        ctx.fillRect(
            0,
            0,
            1024,
            1024
        );
    }


    // ==================================================
    // WANTED
    // ==================================================

    else if (effect === "wanted") {

        ctx.fillStyle =
            "#D2B48C";


        ctx.fillRect(
            0,
            0,
            1024,
            1024
        );


        ctx.drawImage(
            avatar,
            100,
            100,
            824,
            824
        );
    }


    // ==================================================
    // IMPLODE
    // ==================================================

    else if (effect === "implode") {

        const sourceCanvas =
            createCanvas(
                1024,
                1024
            );


        const sourceCtx =
            sourceCanvas.getContext(
                "2d"
            );


        sourceCtx.drawImage(
            avatar,
            0,
            0,
            1024,
            1024
        );


        applyImplodeEffect(
            sourceCanvas,
            canvas
        );
    }


    // ==================================================
    // PIXEL
    // ==================================================

    else if (effect === "pixel") {

        ctx.drawImage(
            avatar,
            0,
            0,
            128,
            128
        );


        ctx.imageSmoothingEnabled =
            false;


        ctx.drawImage(
            canvas,
            0,
            0,
            128,
            128,
            0,
            0,
            1024,
            1024
        );
    }


    return canvas.toBuffer(
        "image/png"
    );
}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    createImage
};