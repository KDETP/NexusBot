const { PermissionsBitField } = require("discord.js");

const users = new Map();

module.exports = {

    async check(message) {

        if (message.author.bot) return;

        if (!message.guild) return;

        if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const now = Date.now();

        if (!users.has(message.author.id)) {

            users.set(message.author.id, []);

        }

        const messages = users.get(message.author.id);

        messages.push(now);

        while (messages.length && now - messages[0] > 8000) {

            messages.shift();

        }

        if (messages.length >= 6) {

            users.delete(message.author.id);

            try {

                await message.member.timeout(
                    60 * 1000,
                    "Spam détecté par Nébul"
                );

                const recent = await message.channel.messages.fetch({
                    limit: 20
                });

                const spam = recent.filter(
                    m => m.author.id === message.author.id
                );

                await message.channel.bulkDelete(spam, true);

                await message.channel.send(
                    `🚫 ${message.author} a été timeout **1 minute** pour spam.`
                );

                const logChannel =
                    message.guild.channels.cache.get("1534951215413067876");

                if (logChannel) {

                    logChannel.send({

                        embeds: [{
                            color: 0xff0000,
                            title: "🚨 Anti-Spam",
                            description:
`${message.author} a été timeout automatiquement.

Durée : **1 minute**

Raison : **Spam**`,
                            timestamp: new Date()
                        }]

                    });

                }

            } catch (err) {

                console.error(err);

            }

        }

    }

};