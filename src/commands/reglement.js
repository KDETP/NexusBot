const {
    EmbedBuilder
} = require("discord.js");


module.exports = {


    name: "reglement",


    async execute(message, args) {


        if (args[0] !== "setup") return;



        const embed = new EmbedBuilder()

        .setColor("#8B5CF6")

        .setTitle("📜 Règlement Nebu")

        .setDescription(
`
Bienvenue sur **Nebu** !


Avant de profiter du serveur, merci de lire et respecter le règlement.


━━━━━━━━━━━━━━


✅ **Respect**

Respecte les autres membres et le staff.


❌ **Interdictions**

• Pas d'insultes ou de harcèlement

• Pas de spam

• Pas de pub sans autorisation

• Pas de contenu interdit


🎮 **Communauté**

Amuse-toi, participe aux événements et garde une bonne ambiance.


━━━━━━━━━━━━━━


📜 Réagis avec **📜** pour accepter le règlement et obtenir ton accès au serveur.
`
        )

        .setFooter({

            text:
            "Nebu • Règlement"

        })





        const msg =
        await message.channel.send({

            embeds:[
                embed
            ]

        });





        await msg.react("📜");



        await message.reply({

            content:
            "✅ Message règlement créé.",

            ephemeral:true

        });



    }


};