const { EmbedBuilder } = require("discord.js");


module.exports = {

name:"ship",


async execute(message){


    const user =
    message.mentions.users.first();



    if(!user){

        return message.reply(
            "❤️ Mentionne quelqu'un ! Exemple : `nship @user`"
        );

    }



    const score =
    Math.floor(
        Math.random() * 101
    );



    let emoji = "💔";


    if(score >= 80)
        emoji = "💖";

    else if(score >= 50)
        emoji = "❤️";



    const embed =
    new EmbedBuilder()

    .setColor("#FF69B4")

    .setTitle(
        "💘 Nebu Ship"
    )

    .setDescription(
`
${message.author} ❤️ ${user}

Compatibilité :

${emoji} **${score}%**
`
    )

    .setTimestamp();



    message.reply({
        embeds:[embed]
    });


}

};