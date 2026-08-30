const { EmbedBuilder } = require("discord.js");


module.exports = {

    name: "comment",


    async execute(message) {


        const channelId = "1535243979808047114";


        const channel = message.guild.channels.cache.get(channelId);


        if (!channel) {

            return message.reply("❌ Salon introuvable.");

        }



        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🌌 NebuCasino • Guide Officiel")

            .setDescription(`
Bienvenue dans **NebuCasino** 🎰

🪙 Ici, les **NebuCoins** sont ta monnaie virtuelle.
Utilise-les pour jouer, tenter ta chance et construire ta fortune.


━━━━━━━━━━━━━━━━━━━━


## 🪙 Comment obtenir des NebuCoins ?


🎁 **Récompense quotidienne**

Commande :

\`nebu daily\`

Récupère une récompense chaque jour.


🧠 **Quiz**

Commande :

\`nebu quiz\`

Réponds correctement aux questions pour gagner des NebuCoins.


━━━━━━━━━━━━━━━━━━━━


## 🎰 Accéder au Casino


Commande :

\`nebu casino\`


Ouvre le menu principal avec tous les jeux disponibles.


━━━━━━━━━━━━━━━━━━━━


## 🃏 Blackjack


Commande :

\`nbj mise\`


Exemples :

\`nbj 500\`

\`nbj all\`


🎯 **Objectif :**

Battre le croupier avec une main proche de **21** sans dépasser.


Actions disponibles :


🎴 **Tirer**

Ajoute une carte.


✋ **Rester**

Garde ta main actuelle.


💰 **Doubler**

Double ta mise et reçoit une dernière carte.


✂️ **Split**

Sépare une paire en deux mains.


💡 Mise maximale :

**100 000 NebuCoins**


━━━━━━━━━━━━━━━━━━━━


## 🎰 Machine à sous


Commande :

\`nslots mise\`


Exemples :

\`nslots 500\`

\`nslots all\`


Aligne les symboles et tente de décrocher un gain.


━━━━━━━━━━━━━━━━━━━━


## 📊 Gestion du compte


🪙 Voir ton argent :

\`nebu balance\`


👤 Voir ton profil :

\`nebu profile\`


━━━━━━━━━━━━━━━━━━━━


## ⚡ Commandes rapides


🃏 Blackjack

\`nbj 500\`


🎰 Slots

\`nslots 500\`


🎁 Daily

\`nebu daily\`


🧠 Quiz

\`nebu quiz\`


━━━━━━━━━━━━━━━━━━━━


⚠️ Les NebuCoins sont uniquement virtuels.

Aucun gain réel.


🍀 Bonne chance et que la fortune soit avec toi !
`)


            .setFooter({
                text: "NebuBot • NebuCasino"
            })


            .setTimestamp();



        const embed2 = new EmbedBuilder()

.setColor("#8B5CF6")

.setTitle("🎰 NebuCasino • Jeux & Commandes")

.setDescription(`
# 🃏 Blackjack

Commande :

\`nbj montant\`

Exemples :

\`nbj 500\`

\`nbj all\`


🎯 **Objectif :**

Être plus proche de **21** que le croupier sans dépasser.


🎮 **Actions disponibles :**

🎴 Tirer  
Ajoute une carte à ta main.

✋ Rester  
Garde ton score actuel.

💰 Doubler  
Double ta mise et reçoit une dernière carte.

✂️ Split  
Disponible avec une paire.


━━━━━━━━━━━━━━━━━━


# 🎰 Machine à sous

Commande :

\`nslots montant\`

Exemples :

\`nslots 500\`

\`nslots all\`


La machine lance 3 symboles.

Les combinaisons gagnantes permettent de récupérer des NebuCoins.


Symboles :

🍒 🍋 🍇 🍉 💎 7️⃣


━━━━━━━━━━━━━━━━━━


# 📊 Gestion

Voir son argent :

\`nebu balance\`


Voir son profil :

\`nebu profile\`


━━━━━━━━━━━━━━━━━━


⚠️ Les NebuCoins sont une monnaie virtuelle.

Aucun gain réel.

🍀 Bonne chance !
`)

.setFooter({
    text: "NebuBot • NebuCasino"
})

.setTimestamp();



await channel.send({
    embeds: [embed, embed2]
});



        return message.reply("✅ Guide casino envoyé.");

    }

};