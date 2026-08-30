const {
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const betManager = require("../services/casino/betManager");


const economyPath = path.join(
    __dirname,
    "..",
    "data",
    "economy.json"
);


const symbols = [
    "🍒",
    "🍋",
    "🍇",
    "🍉",
    "💎",
    "7️⃣"
];


function randomSymbol() {

    return symbols[
        Math.floor(Math.random() * symbols.length)
    ];

}


function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}



module.exports = {

    name: "slots",


    async execute(message, args) {


        const economy = JSON.parse(
            fs.readFileSync(economyPath, "utf8")
        );


        if (!economy[message.author.id]) {

            economy[message.author.id] = {
                money: 500
            };

        }



        const result = betManager.getBet(
            args[0],
            economy[message.author.id].money
        );


        if (result.error) {

            return message.reply(result.error);

        }


        const bet = result.bet;


        economy[message.author.id].money -= bet;


        fs.writeFileSync(
            economyPath,
            JSON.stringify(economy, null, 2)
        );



        const embed = new EmbedBuilder()

            .setColor("#8B5CF6")

            .setTitle("🎰 Machine à sous")

            .setDescription(
`
🎰 Les rouleaux tournent...

⬜ ⬜ ⬜
⬜ ⬜ ⬜
⬜ ⬜ ⬜

💰 Mise : **${bet} NebuCoins**
`
            );



        const msg = await message.reply({
            embeds: [embed]
        });


        // Animation des rouleaux

let slot1;
let slot2;
let slot3;


// Rouleaux qui tournent

for (let i = 0; i < 12; i++) {

    embed.setDescription(
`
🎰 Rouleaux en mouvement...

${randomSymbol()}  ${randomSymbol()}  ${randomSymbol()}

💰 Mise : **${bet} NebuCoins**
`
    );


    await msg.edit({
        embeds: [embed]
    });


    await sleep(150);

}


// Résultat final des rouleaux

slot1 = randomSymbol();
slot2 = randomSymbol();
slot3 = randomSymbol();

let gain = 0;

        let resultText = "❌ Perdu !";



        if (
            slot1 === slot2 &&
            slot2 === slot3
        ) {

            gain = bet * 5;

            resultText = "🎉 JACKPOT !";


        } else if (
            slot1 === slot2 ||
            slot2 === slot3 ||
            slot1 === slot3
        ) {

            gain = bet * 2;

            resultText = "✨ Belle combinaison !";

        }



        if (gain > 0) {

            economy[message.author.id].money += gain;

        }



        fs.writeFileSync(
            economyPath,
            JSON.stringify(economy, null, 2)
        );



        embed.setDescription(
`
🎰 Résultat :

${slot1}  ${slot2}  ${slot3}


💰 Mise : **${bet} NebuCoins**

${resultText}

${gain > 0
? `🪙 Gain : **+${gain} NebuCoins**`
: ""}
`
        );


        await msg.edit({
            embeds: [embed]
        });


    }

};