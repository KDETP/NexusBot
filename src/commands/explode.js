const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createImage
} = require("../utils/imageTools");


module.exports = {

name:"explode",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const image =
    await createImage(
        "explode",
        user
    );



    const file =
    new AttachmentBuilder(
        image,
        {
            name:"explode.png"
        }
    );



    const embed =
    new EmbedBuilder()

    .setColor("#8B5CF6")

    .setTitle(
        "💥 Nebu Explode"
    )

    .setImage(
        "attachment://explode.png"
    );



    message.reply({

        embeds:[
            embed
        ],

        files:[
            file
        ]

    });


}

};