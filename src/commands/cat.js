const { EmbedBuilder } = require("discord.js");


module.exports = {

name:"cat",


async execute(message){



    const embed =
    new EmbedBuilder()

    .setColor("#8B5CF6")

    .setTitle(
        "🐱 Nebu Cat"
    )

    .setImage(
        "https://cataas.com/cat"
    );



    message.reply({
        embeds:[embed]
    });


}

};