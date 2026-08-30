const { EmbedBuilder } = require("discord.js");


module.exports = {

name:"facepalm",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const embed =
    new EmbedBuilder()

    .setColor("#FFA500")

    .setTitle(
        "🤦 Facepalm"
    )

    .setImage(
        user.displayAvatarURL({
            size:1024
        })
    );


    message.reply({
        embeds:[embed]
    });


}

};