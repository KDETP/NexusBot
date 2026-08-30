const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createImage
} = require("../utils/imageTools");


module.exports = {

name:"triggered",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const image =
    await createImage(
        "triggered",
        user
    );



    const file =
    new AttachmentBuilder(
        image,
        {
            name:"triggered.png"
        }
    );



    const embed =
    new EmbedBuilder()

    .setColor("#FF0000")

    .setTitle(
        "😡 TRIGGERED"
    )

    .setImage(
        "attachment://triggered.png"
    );


    message.reply({

        embeds:[embed],

        files:[file]

    });


}

};