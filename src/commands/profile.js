const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");


module.exports = {


name: "profile",



async execute(message) {



    const user =
    await message.client.users.fetch(
        message.author.id,
        {
            force:true
        }
    );



    const economyFile =
    path.join(
        __dirname,
        "..",
        "data",
        "economy.json"
    );


    const profilesFile =
    path.join(
        __dirname,
        "..",
        "data",
        "profiles.json"
    );



    const economy =
    JSON.parse(
        fs.readFileSync(
            economyFile,
            "utf8"
        )
    );



    const profiles =
    JSON.parse(
        fs.readFileSync(
            profilesFile,
            "utf8"
        )
    );



    const id =
    message.author.id;




    if(!economy[id]){


        economy[id] = {

            money:500

        };


        fs.writeFileSync(
            economyFile,
            JSON.stringify(economy,null,2)
        );

    }




    if(!profiles[id]){


        profiles[id] = {

            level:1,
            xp:0,
            quiz:0,
            work:0,
            casino:0

        };


        fs.writeFileSync(
            profilesFile,
            JSON.stringify(profiles,null,2)
        );

    }





    const level =
    profiles[id].level;


    const xp =
    profiles[id].xp;



    const xpMax =
    level * 500;



    const progress =
    Math.floor(
        (xp / xpMax) * 10
    );



    const bar =
    "🟪".repeat(
        Math.min(progress,10)
    )
    +
    "⬛".repeat(
        Math.max(10-progress,0)
    );






    const embed =
    new EmbedBuilder()



    .setColor("#8B5CF6")



    .setAuthor({

        name:
        `${user.username}`,

        iconURL:
        user.displayAvatarURL({
            size:1024
        })

    })



    .setTitle(
        "🌌 Profil Nébula"
    )



    .setDescription(
`
✨ **Bienvenue dans ton espace Nébulae**

👤 Utilisateur :
${user}

━━━━━━━━━━━━━━

⭐ **Niveau**
${level}

✨ **XP**
${xp} / ${xpMax}

${bar}

━━━━━━━━━━━━━━
`
    )



    .addFields(


        {
            name:"💰 NebuCoins",
            value:
            `${economy[id].money}`,
            inline:true
        },


        {
            name:"🏆 Quiz gagnés",
            value:
            `${profiles[id].quiz}`,
            inline:true
        },


        {
            name:"💼 Travaux",
            value:
            `${profiles[id].work}`,
            inline:true
        },


        {
            name:"🎰 Casino",
            value:
            `${profiles[id].casino}`,
            inline:true
        }


    )



    .setThumbnail(
        user.displayAvatarURL({
            size:1024
        })
    )



    // BANNIERE NEBUL POUR TOUT LE MONDE
    .setImage(
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2V4a3F5bG5hN2F5Z2Z3bWJ6Y2J4b3B4cWQ5N2R3cG5hN2ZqZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7aD4HnY4JQ6YvXnW/giphy.gif"
    )



    .setFooter({

        text:
        "Nébula • Profil"

    })



    .setTimestamp();





    return message.reply({

        embeds:[
            embed
        ]

    });



}


};