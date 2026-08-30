const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


module.exports = {

    name: "ticket",

    async execute(message) {


        const salon = message.guild.channels.cache.get(
            "1415764652679495710"
        );


        if (!salon) {
            return message.reply("❌ Salon ticket introuvable");
        }



        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎫 Support NebuCommunity")

            .setDescription(`
Besoin d'aide ?

Clique sur le bouton ci-dessous pour ouvrir un ticket.

Un membre du staff viendra répondre à ta demande.
            `)

            .setFooter({
                text: "NebuBot • Support"
            });



        const bouton = new ActionRowBuilder()
        
        .addComponents(

            new ButtonBuilder()

            .setCustomId("ouvrir_ticket")

            .setLabel("🎫 Ouvrir un ticket")

            .setStyle(ButtonStyle.Primary)

        );



        await salon.send({

            embeds: [embed],

            components: [bouton]

        });



        message.reply("✅ Panneau ticket envoyé");

    }

};