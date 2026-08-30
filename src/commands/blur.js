const {
AttachmentBuilder,
EmbedBuilder
} = require("discord.js");

const {
createImage
} = require("../utils/imageTools");


module.exports = {

name:"blur",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const image =
    await createImage(
        "blur",
        user
    );



    const file =
    new AttachmentBuilder(
        image,
        {
            name:"blur.png"
        }
    );



    const embed =
    new EmbedBuilder()

    .setColor("#8B5CF6")

    .setTitle(
        "🌫️ Nebu Blur"
    )

    .setImage(
        "attachment://blur.png"
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