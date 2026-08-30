const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createImage
} = require("../utils/imageTools");


module.exports = {

name:"pixel",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const image =
    await createImage(
        "pixel",
        user
    );



    const file =
    new AttachmentBuilder(
        image,
        {
            name:"pixel.png"
        }
    );



    const embed =
    new EmbedBuilder()

    .setColor("#00FFFF")

    .setTitle(
        "👾 Nebu Pixel"
    )

    .setImage(
        "attachment://pixel.png"
    );


    message.reply({

        embeds:[embed],

        files:[file]

    });


}

};