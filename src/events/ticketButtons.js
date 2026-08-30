const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");


const requestChannel = "1415764652679495710";


const staffRoles = [
    "1457855405370900662",
    "1415339900445786183",
    "1465840162524102749",
    "1415340033627525201",
    "1415339976886980649",
    "1415339840198938664",
    "1415339765657764002"
];



module.exports = async (client, interaction) => {


    if (
        !interaction.isButton() &&
        !interaction.isStringSelectMenu()
    ) return;



    // OUVERTURE MENU

    if (interaction.customId === "create_ticket") {



        const menu = new ActionRowBuilder()
        .addComponents(

            new StringSelectMenuBuilder()

            .setCustomId("ticket_category")

            .setPlaceholder(
                "Choisis ton type de ticket"
            )

            .addOptions([

                {
                    label: "Support",
                    value: "support",
                    emoji: "🛠️",
                    description: "Besoin d'aide"
                },


                {
                    label: "Signalement",
                    value: "signalement",
                    emoji: "🚨",
                    description: "Signaler un problème"
                },


                {
                    label: "Partenariat",
                    value: "partenariat",
                    emoji: "🤝",
                    description: "Proposer un partenariat"
                },


                {
                    label: "Question",
                    value: "question",
                    emoji: "❓",
                    description: "Une question"
                }

            ])

        );



        return interaction.reply({

            content:
            "🎫 Choisis la catégorie de ton ticket :",


            components:[menu],

            ephemeral:true

        });

    }





    // CREATION DE LA DEMANDE


        if (
    interaction.customId === "ticket_category"
) {

        const type = interaction.values[0];



        const names = {

            support:"🛠️",

            signalement:"🚨",

            partenariat:"🤝",

            question:"❓"

        };



        const titles = {

            support:"Support",

            signalement:"Signalement",

            partenariat:"Partenariat",

            question:"Question"

        };




        const buttons = new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

            .setCustomId(
                "accept_ticket"
            )

            .setLabel(
                "✅ Accepter"
            )

            .setStyle(
                ButtonStyle.Success
            ),


            new ButtonBuilder()

            .setCustomId(
                "deny_ticket"
            )

            .setLabel(
                "❌ Refuser"
            )

            .setStyle(
                ButtonStyle.Danger
            )

        );



        const ping = staffRoles
        .map(r => `<@&${r}>`)
        .join(" ");



        const embed = new EmbedBuilder()

        .setColor("#8B5CF6")

        .setTitle(
            "🎫 Nouvelle demande de ticket"
        )

        .setDescription(
`
👤 Demandeur :

${interaction.user}


📂 Catégorie :

${names[type]} ${titles[type]}


⏳ Statut :

En attente d'un membre du staff.
`
        )

        .setTimestamp();



        const channel =
        interaction.guild.channels.cache.get(
            requestChannel
        );



        await channel.send({

            content: ping,

            embeds:[embed],

            components:[buttons]

        });



        return interaction.reply({

            content:
            "✅ Ta demande a été envoyée au staff.",

            ephemeral:true

        });


    }


};