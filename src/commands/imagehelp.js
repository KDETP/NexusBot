const { EmbedBuilder } = require("discord.js");


module.exports = {

name:"imagehelp",


async execute(message){


const embed =
new EmbedBuilder()

.setColor("#8B5CF6")

.setTitle(
"🎨 Nebu Image Tools"
)

.setDescription(
`
🖼️ **Photos**
\`npp\`
\`nbanner\`

✨ **Effets**
\`nblur\`
\`nexplode\`
\`nimplode\`
\`npixel\`
\`ntriggered\`
\`nwanted\`

😂 **Fun**
\`nship @user\`
\`nfacepalm @user\`
\`ntrash @user\`
\`ncat\`

🌌 Nébula Image System
`
);


message.reply({
    embeds:[embed]
});


}

};