const { EmbedBuilder } = require("discord.js");


module.exports = {

name:"trash",


async execute(message){


    const user =
    message.mentions.users.first()
    ||
    message.author;



    const embed =
    new EmbedBuilder()

    .setColor("#555555")

    .setTitle(
        "🗑️ Trash"
    )

    .setDescription(
        `${user} est parti à la poubelle 💀`
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