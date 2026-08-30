const fs = require("fs");
const path = require("path");

const BACKUP_ACCESS_ROLE = "1457855405370900662";

module.exports = {

    name: "backup",

    async execute(message) {

        // ==================================================
        // SERVEUR UNIQUEMENT
        // ==================================================

        if (!message.guild) {
            return message.reply(
                "❌ Cette commande fonctionne uniquement sur un serveur."
            );
        }

        // ==================================================
        // VÉRIFICATION DU RÔLE
        // ==================================================

        if (
            !message.member.roles.cache.has(
                BACKUP_ACCESS_ROLE
            )
        ) {
            return message.reply(
                "❌ Tu n'as pas le rôle requis pour utiliser cette commande."
            );
        }

        // ==================================================
        // MESSAGE DE CHARGEMENT
        // ==================================================

        const statusMessage = await message.reply(
            "⏳ **Sauvegarde complète du serveur en cours...**"
        );

        try {

            const guild = message.guild;

            // ==================================================
            // INFORMATIONS SERVEUR
            // ==================================================

            const backup = {

                version: 2,

                createdAt:
                    new Date().toISOString(),

                guild: {

                    id:
                        guild.id,

                    name:
                        guild.name,

                    description:
                        guild.description || null,

                    verificationLevel:
                        guild.verificationLevel,

                    defaultMessageNotifications:
                        guild.defaultMessageNotifications,

                    explicitContentFilter:
                        guild.explicitContentFilter,

                    afkTimeout:
                        guild.afkTimeout,

                    systemChannelId:
                        guild.systemChannelId || null,

                    rulesChannelId:
                        guild.rulesChannelId || null,

                    publicUpdatesChannelId:
                        guild.publicUpdatesChannelId || null,

                    preferredLocale:
                        guild.preferredLocale

                },

                // ==================================================
                // RÔLES
                // ==================================================

                roles:
                    guild.roles.cache
                        .sort(
                            (a, b) =>
                                a.position - b.position
                        )
                        .map(role => ({

                            id:
                                role.id,

                            name:
                                role.name,

                            color:
                                role.hexColor,

                            hoist:
                                role.hoist,

                            position:
                                role.position,

                            permissions:
                                role.permissions.bitfield.toString(),

                            mentionable:
                                role.mentionable,

                            managed:
                                role.managed

                        })),

                // ==================================================
                // SALONS
                // ==================================================

                channels:
                    guild.channels.cache
                        .sort(
                            (a, b) =>
                                a.rawPosition - b.rawPosition
                        )
                        .map(channel => ({

                            id:
                                channel.id,

                            name:
                                channel.name,

                            type:
                                channel.type,

                            position:
                                channel.rawPosition,

                            parentId:
                                channel.parentId || null,

                            topic:
                                channel.topic || null,

                            nsfw:
                                channel.nsfw || false,

                            rateLimitPerUser:
                                channel.rateLimitPerUser || 0,

                            bitrate:
                                channel.bitrate || null,

                            userLimit:
                                channel.userLimit || null,

                            permissionOverwrites:
                                channel.permissionOverwrites
                                    ? channel.permissionOverwrites.cache
                                        .map(overwrite => ({

                                            id:
                                                overwrite.id,

                                            type:
                                                overwrite.type,

                                            allow:
                                                overwrite.allow.bitfield.toString(),

                                            deny:
                                                overwrite.deny.bitfield.toString()

                                        }))
                                    : []

                        })),

                // ==================================================
                // EMOJIS
                // ==================================================

                emojis:
                    guild.emojis.cache
                        .map(emoji => ({

                            id:
                                emoji.id,

                            name:
                                emoji.name,

                            animated:
                                emoji.animated,

                            url:
                                emoji.imageURL()

                        })),

                // ==================================================
                // STICKERS
                // ==================================================

                stickers:
                    guild.stickers.cache
                        .map(sticker => ({

                            id:
                                sticker.id,

                            name:
                                sticker.name,

                            description:
                                sticker.description,

                            tags:
                                sticker.tags,

                            format:
                                sticker.format

                        }))

            };

            // ==================================================
            // DOSSIER BACKUPS
            // ==================================================

            const backupDirectory =
                path.join(
                    __dirname,
                    "../../backups"
                );

            if (
                !fs.existsSync(
                    backupDirectory
                )
            ) {

                fs.mkdirSync(
                    backupDirectory,
                    {
                        recursive: true
                    }
                );

            }

            // ==================================================
            // NOM DU FICHIER
            // ==================================================

            const timestamp =
                new Date()
                    .toISOString()
                    .replace(
                        /[:.]/g,
                        "-"
                    );

            const fileName =
                `Nebu_Backup_${guild.id}_${timestamp}.json`;

            const filePath =
                path.join(
                    backupDirectory,
                    fileName
                );

            // ==================================================
            // ÉCRITURE DU JSON
            // ==================================================

            fs.writeFileSync(

                filePath,

                JSON.stringify(
                    backup,
                    null,
                    4
                ),

                "utf8"

            );

            // ==================================================
            // STATISTIQUES
            // ==================================================

            const roleCount =
                backup.roles.length;

            const channelCount =
                backup.channels.length;

            const emojiCount =
                backup.emojis.length;

            const stickerCount =
                backup.stickers.length;

            // ==================================================
            // ENVOI EN DM
            // ==================================================

            try {

                await message.author.send({

                    content:
                        `🛡️ **Backup complète de ${guild.name}**\n\n` +

                        `🎭 Rôles : **${roleCount}**\n` +

                        `📁 Salons : **${channelCount}**\n` +

                        `😀 Emojis : **${emojiCount}**\n` +

                        `🏷️ Stickers : **${stickerCount}**\n\n` +

                        `📦 Sauvegarde créée le <t:${Math.floor(Date.now() / 1000)}:F>`,

                    files: [

                        {

                            attachment:
                                filePath,

                            name:
                                fileName

                        }

                    ]

                });

                // ==================================================
                // SUCCÈS
                // ==================================================

                await statusMessage.edit(
                    "✅ **Backup terminée !**\n📩 La sauvegarde complète t'a été envoyée en DM."
                );

            } catch (dmError) {

                console.error(
                    "❌ Impossible d'envoyer la backup en DM :",
                    dmError
                );

                await statusMessage.edit(
                    "⚠️ **Backup créée avec succès**, mais je n'ai pas réussi à te l'envoyer en DM. Vérifie que tes DM sont ouverts."
                );

            }

            // ==================================================
            // LOG
            // ==================================================

            console.log(
                `🛡️ BACKUP | ${message.author.tag} | ${guild.name}`
            );

            console.log(
                `📦 Rôles : ${roleCount}`
            );

            console.log(
                `📁 Salons : ${channelCount}`
            );

            console.log(
                `😀 Emojis : ${emojiCount}`
            );

            console.log(
                `🏷️ Stickers : ${stickerCount}`
            );

            console.log(
                `💾 Fichier : ${fileName}`
            );

        } catch (error) {

            // ==================================================
            // ERREUR
            // ==================================================

            console.error(
                "❌ Erreur backup :",
                error
            );

            try {

                await statusMessage.edit(
                    "❌ **Erreur pendant la création de la backup.** Consulte la console du bot."
                );

            } catch (editError) {

                console.error(
                    "❌ Impossible de modifier le message d'erreur :",
                    editError
                );

            }

        }

    }

};