const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createImage
} = require("../utils/imageTools");


module.exports = {

name:"wanted",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const image =
    await createImage(
        "wanted",
        user
    );



    const file =
    new AttachmentBuilder(
        image,
        {
            name:"wanted.png"
        }
    );



    const embed =
    new EmbedBuilder()

    .setColor("#C49A6C")

    .setTitle(
        "🤠 WANTED"
    )

    .setImage(
        "attachment://wanted.png"
    );


    message.reply({

        embeds:[embed],

        files:[file]

    });


}

};