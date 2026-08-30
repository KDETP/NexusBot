const {
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");


const statsPath = path.join(
    __dirname,
    "..",
    "data",
    "serverStats.json"
);


// Mets ton ID et celui de Killian ici
const owners = [
    "811047005513973760",
    "1471794673008771162"
];


module.exports = {

    name: "stats",


    async execute(message) {

        await message.guild.members.fetch();


        if (!owners.includes(message.author.id)) {

            return message.reply(
                "❌ Tu n'as pas la permission d'utiliser cette commande."
            );

        }



        // Création catégorie

        const category = await message.guild.channels.create({

            name: "📊 SERVER STATS",

            type: ChannelType.GuildCategory

        });



        const total = await message.guild.channels.create({

            name: `🌎 Total : ${message.guild.memberCount}`,

            type: ChannelType.GuildVoice,

            parent: category.id,

            permissionOverwrites: [

                {

                    id: message.guild.id,

                    deny: [
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak
                    ]

                }

            ]

        });



        const members = await message.guild.channels.create({

            name: `👥 Membres : ${message.guild.members.cache.filter(m => !m.user.bot).size}`,

            type: ChannelType.GuildVoice,

            parent: category.id,

            permissionOverwrites: [

                {

                    id: message.guild.id,

                    deny: [
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak
                    ]

                }

            ]

        });



        const bots = await message.guild.channels.create({

            name: `🤖 Bots : ${message.guild.members.cache.filter(m => m.user.bot).size}`,

            type: ChannelType.GuildVoice,

            parent: category.id,

            permissionOverwrites: [

                {

                    id: message.guild.id,

                    deny: [
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak
                    ]

                }

            ]

        });



        fs.writeFileSync(

            statsPath,

            JSON.stringify({

                category: category.id,

                total: total.id,

                members: members.id,

                bots: bots.id

            }, null, 2)

        );



        return message.reply(
            "✅ Server Stats créés avec succès."
        );


    }

};