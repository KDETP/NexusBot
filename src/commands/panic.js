const {
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const protection = require("../services/protection");

const WHITELIST = [
    "1457855405370900662",
    "1415339900445786183",
    "1465840162524102749",
    "1415340033627525201",
    "1415339976886980649",
    "1415338068659146812",
    "1415339840198938664",
    "1415339765657764002"
];

module.exports = {

    name: "panic",

    async execute(message, args) {

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply("❌ Tu dois être administrateur.");

        if (!args[0])
            return message.reply("Utilisation : `nebu panic on` ou `nebu panic off`");

        const enable = args[0].toLowerCase() === "on";

        if (enable)
            protection.enablePanic();
        else
            protection.disablePanic();

        for (const [, channel] of message.guild.channels.cache) {

            if (channel.type !== ChannelType.GuildText) continue;

            try {

                if (enable) {

                    await channel.permissionOverwrites.edit(
                        message.guild.roles.everyone,
                        {
                            SendMessages: false
                        }
                    );

                    for (const roleId of WHITELIST) {

                        const role = message.guild.roles.cache.get(roleId);

                        if (!role) continue;

                        await channel.permissionOverwrites.edit(role, {
                            SendMessages: true
                        });

                    }

                } else {

                    await channel.permissionOverwrites.delete(
                        message.guild.roles.everyone
                    );

                    for (const roleId of WHITELIST) {

                        const role = message.guild.roles.cache.get(roleId);

                        if (!role) continue;

                        await channel.permissionOverwrites.delete(role);

                    }

                }

            } catch (err) {

                console.error(err);

            }

        }

        const general = message.guild.channels.cache.get("1532756693878837381");

        if (general) {

            await general.send({

                embeds: [

                    new EmbedBuilder()

                        .setColor(enable ? "#ff0000" : "#00c853")

                        .setTitle(enable ? "🚨 MODE PANIC ACTIVÉ" : "✅ MODE PANIC DÉSACTIVÉ")

                        .setDescription(enable ?

                            "Le serveur est temporairement protégé.\n\n🛡️ AntiSpam renforcé\n🚫 Liens bloqués\n🚫 Invitations bloquées"

                            :

                            "Le serveur est revenu à son fonctionnement normal."

                        )

                        .setTimestamp()

                ]

            });

        }

        await message.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(enable ? "#ff0000" : "#00c853")

                    .setTitle(enable ? "🚨 Panic activé" : "✅ Panic désactivé")

                    .setDescription(enable ?

                        "Toutes les protections sont désormais actives."

                        :

                        "Toutes les protections sont désactivées."

                    )

            ]

        });

    }

};