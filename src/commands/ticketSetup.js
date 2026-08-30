const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


module.exports = {

    name: "ticket",


    async execute(message, args) {


        if (args[0] !== "setup") return;



        const channel = message.guild.channels.cache.get(
            "1415764652679495710"
        );


        if (!channel) {

            return message.reply(
                "❌ Salon ticket introuvable."
            );

        }



        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎫 NebuTicket")

            .setDescription(
`
Besoin d'aide ?


Clique sur le bouton ci-dessous pour ouvrir un ticket.


📌 Catégories :

🛠️ Support

🚨 Signalement

🤝 Partenariat

❓ Question


Un membre du staff répondra rapidement.
`
            )

            .setFooter({

                text: "NebuTicket • Support"

            })

            .setTimestamp();



        const button = new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId("create_ticket")

                    .setLabel("🎫 Ouvrir un ticket")

                    .setStyle(ButtonStyle.Primary)

            );



        await channel.send({

            embeds: [embed],

            components: [button]

        });



        message.reply(
            "✅ Panneau NebuTicket créé."
        );


    }

};