const fs = require("fs");
const path = require("path");

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits
} = require("discord.js");


// ==================================================
// CONFIGURATION
// ==================================================

const RESTORE_ACCESS_ROLE =
    "1457855405370900662";


// ==================================================
// DOSSIER DES BACKUPS
// ==================================================

const BACKUP_DIRECTORY =
    path.join(
        __dirname,
        "../../backups"
    );


// ==================================================
// COMMANDE
// ==================================================

module.exports = {

    name: "restore",

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
                RESTORE_ACCESS_ROLE
            )
        ) {

            return message.reply(
                "❌ Tu n'as pas le rôle requis pour utiliser cette commande."
            );

        }


        // ==================================================
        // VÉRIFICATION DU DOSSIER
        // ==================================================

        if (
            !fs.existsSync(
                BACKUP_DIRECTORY
            )
        ) {

            return message.reply(
                "❌ Aucun dossier `backups` n'existe encore."
            );

        }


        // ==================================================
        // RÉCUPÉRATION DES BACKUPS
        // ==================================================

        const backupFiles =
            fs.readdirSync(
                BACKUP_DIRECTORY
            )
            .filter(
                file =>
                    file.endsWith(".json")
            )
            .sort()
            .reverse();


        if (
            backupFiles.length === 0
        ) {

            return message.reply(
                "❌ Aucune backup disponible."
            );

        }


        // ==================================================
        // LIMITE DISCORD
        // ==================================================

        const displayedBackups =
            backupFiles.slice(0, 25);


        // ==================================================
        // OPTIONS
        // ==================================================

        const options =
            displayedBackups.map(
                file => {

                    const filePath =
                        path.join(
                            BACKUP_DIRECTORY,
                            file
                        );

                    let backup;

                    try {

                        backup =
                            JSON.parse(
                                fs.readFileSync(
                                    filePath,
                                    "utf8"
                                )
                            );

                    } catch {

                        backup = null;

                    }


                    return {

                        label:
                            file.length > 100
                                ? file.substring(
                                    0,
                                    100
                                )
                                : file,

                        description:
                            backup
                                ? `${backup.guild?.name || "Serveur"} • ${backup.roles?.length || 0} rôles • ${backup.channels?.length || 0} salons`
                                : "Backup invalide",

                        value:
                            file

                    };

                }
            );


        // ==================================================
        // MENU BACKUP
        // ==================================================

        const backupMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `restore_backup_${message.author.id}`
                )

                .setPlaceholder(
                    "📦 Choisir une backup"
                )

                .setMinValues(1)

                .setMaxValues(1)

                .addOptions(
                    options
                );


        // ==================================================
        // EMBED
        // ==================================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    "#F59E0B"
                )

                .setTitle(
                    "🛡️ Restauration du serveur"
                )

                .setDescription(
                    "Sélectionne la sauvegarde à restaurer.\n\n" +

                    "⚠️ **La restauration modifie la structure du serveur.**\n" +

                    "Les éléments existants ne seront pas supprimés automatiquement.\n\n" +

                    "🔐 Accès réservé au rôle de gestion."
                )

                .setFooter({
                    text:
                        "Nebu • Server Restore"
                });


        // ==================================================
        // BOUTON ANNULER
        // ==================================================

        const cancelButton =
            new ButtonBuilder()

                .setCustomId(
                    `restore_cancel_${message.author.id}`
                )

                .setLabel(
                    "Annuler"
                )

                .setEmoji(
                    "❌"
                )

                .setStyle(
                    ButtonStyle.Secondary
                );


        // ==================================================
        // ENVOI DU PANNEAU
        // ==================================================

        const panel =
            await message.channel.send({

                embeds: [
                    embed
                ],

                components: [

                    new ActionRowBuilder()
                        .addComponents(
                            backupMenu
                        ),

                    new ActionRowBuilder()
                        .addComponents(
                            cancelButton
                        )

                ]

            });


        // ==================================================
        // VARIABLES
        // ==================================================

        let selectedBackup =
            null;


        // ==================================================
        // COLLECTOR
        // ==================================================

        const collector =
            panel.createMessageComponentCollector({

                time:
                    5 * 60 * 1000

            });


        collector.on(
            "collect",
            async interaction => {

                // ==================================================
                // SÉCURITÉ
                // ==================================================

                if (
                    interaction.user.id !==
                    message.author.id
                ) {

                    return interaction.reply({

                        content:
                            "❌ Ce panneau ne t'appartient pas.",

                        ephemeral:
                            true

                    });

                }


                // ==================================================
                // ANNULATION
                // ==================================================

                if (
                    interaction.customId ===
                    `restore_cancel_${message.author.id}`
                ) {

                    await interaction.update({

                        embeds: [

                            embed.setDescription(
                                "❌ **Restauration annulée.**"
                            )

                        ],

                        components: []

                    });

                    collector.stop();

                    return;

                }


                // ==================================================
                // CHOIX BACKUP
                // ==================================================

                if (
                    interaction.customId ===
                    `restore_backup_${message.author.id}`
                ) {

                    selectedBackup =
                        interaction.values[0];


                    const filePath =
                        path.join(
                            BACKUP_DIRECTORY,
                            selectedBackup
                        );


                    let backup;

                    try {

                        backup =
                            JSON.parse(
                                fs.readFileSync(
                                    filePath,
                                    "utf8"
                                )
                            );

                    } catch {

                        return interaction.reply({

                            content:
                                "❌ Cette backup est invalide ou illisible.",

                            ephemeral:
                                true

                        });

                    }


                    // ==================================================
                    // BOUTON CONFIRMATION
                    // ==================================================

                    const confirmButton =
                        new ButtonBuilder()

                            .setCustomId(
                                `restore_confirm_${message.author.id}`
                            )

                            .setLabel(
                                "RESTaurer le serveur"
                            )

                            .setEmoji(
                                "🚨"
                            )

                            .setStyle(
                                ButtonStyle.Danger
                            );


                    const cancelButton2 =
                        new ButtonBuilder()

                            .setCustomId(
                                `restore_cancel2_${message.author.id}`
                            )

                            .setLabel(
                                "Annuler"
                            )

                            .setEmoji(
                                "❌"
                            )

                            .setStyle(
                                ButtonStyle.Secondary
                            );


                    const confirmationEmbed =
                        new EmbedBuilder()

                            .setColor(
                                "#EF4444"
                            )

                            .setTitle(
                                "🚨 Confirmation de restauration"
                            )

                            .setDescription(

                                `Tu es sur le point de restaurer :\n\n` +

                                `📦 **${selectedBackup}**\n\n` +

                                `🎭 Rôles : **${backup.roles?.length || 0}**\n` +

                                `📁 Salons : **${backup.channels?.length || 0}**\n` +

                                `😀 Emojis : **${backup.emojis?.length || 0}**\n\n` +

                                `⚠️ Cette opération peut modifier de nombreux éléments du serveur.\n\n` +

                                `**Veux-tu vraiment continuer ?**`

                            );


                    return interaction.update({

                        embeds: [

                            confirmationEmbed

                        ],

                        components: [

                            new ActionRowBuilder()
                                .addComponents(
                                    confirmButton,
                                    cancelButton2
                                )

                        ]

                    });

                }


                // ==================================================
                // ANNULATION 2
                // ==================================================

                if (
                    interaction.customId ===
                    `restore_cancel2_${message.author.id}`
                ) {

                    await interaction.update({

                        embeds: [

                            embed.setDescription(
                                "❌ **Restauration annulée.**"
                            )

                        ],

                        components: []

                    });

                    collector.stop();

                    return;

                }


                // ==================================================
                // CONFIRMATION
                // ==================================================

                if (
                    interaction.customId ===
                    `restore_confirm_${message.author.id}`
                ) {

                    if (
                        !selectedBackup
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Aucune backup sélectionnée.",

                            ephemeral:
                                true

                        });

                    }


                    await interaction.update({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    "#F59E0B"
                                )

                                .setTitle(
                                    "⏳ Restauration en cours..."
                                )

                                .setDescription(
                                    "Le serveur est en cours de restauration.\n\n" +
                                    "🎭 Rôles\n" +
                                    "📁 Salons\n" +
                                    "🔐 Permissions\n\n" +
                                    "Ne ferme pas le bot."
                                )

                        ],

                        components: []

                    });


                    try {

                        const filePath =
                            path.join(
                                BACKUP_DIRECTORY,
                                selectedBackup
                            );


                        const backup =
                            JSON.parse(
                                fs.readFileSync(
                                    filePath,
                                    "utf8"
                                )
                            );


                        const guild =
                            message.guild;


                        // ==================================================
                        // MAP DES RÔLES
                        // ==================================================

                        const roleMap =
                            new Map();


                        // @everyone
                        roleMap.set(
                            guild.id,
                            guild.id
                        );


                        // ==================================================
                        // RESTAURATION DES RÔLES
                        // ==================================================

                        const sortedRoles =
                            [...(
                                backup.roles || []
                            )]
                            .sort(
                                (a, b) =>
                                    a.position -
                                    b.position
                            );


                        let restoredRoles =
                            0;


                        for (
                            const roleData
                            of sortedRoles
                        ) {

                            // ----------------------------------------------
                            // @everyone
                            // ----------------------------------------------

                            if (
                                roleData.id ===
                                guild.id
                            ) {

                                continue;

                            }


                            // ----------------------------------------------
                            // RÔLES MANAGÉS
                            // ----------------------------------------------

                            if (
                                roleData.managed
                            ) {

                                continue;

                            }


                            let role =
                                guild.roles.cache.find(
                                    existingRole =>
                                        existingRole.name ===
                                        roleData.name
                                );


                            // ----------------------------------------------
                            // CRÉATION
                            // ----------------------------------------------

                            if (
                                !role
                            ) {

                                role =
                                    await guild.roles.create({

                                        name:
                                            roleData.name,

                                        color:
                                            roleData.color ===
                                            "#000000"
                                                ? undefined
                                                : roleData.color,

                                        hoist:
                                            roleData.hoist,

                                        permissions:
                                            BigInt(
                                                roleData.permissions
                                            ),

                                        mentionable:
                                            roleData.mentionable,

                                        reason:
                                            "Nebu Restore"

                                    });

                                restoredRoles++;

                            }

                            else {

                                // ------------------------------------------
                                // MISE À JOUR
                                // ------------------------------------------

                                try {

                                    await role.edit({

                                        name:
                                            roleData.name,

                                        color:
                                            roleData.color ===
                                            "#000000"
                                                ? undefined
                                                : roleData.color,

                                        hoist:
                                            roleData.hoist,

                                        permissions:
                                            BigInt(
                                                roleData.permissions
                                            ),

                                        mentionable:
                                            roleData.mentionable,

                                        reason:
                                            "Nebu Restore"

                                    });

                                } catch (
                                    roleError
                                ) {

                                    console.error(
                                        `⚠️ Impossible de modifier le rôle ${roleData.name}:`,
                                        roleError.message
                                    );

                                }

                            }


                            roleMap.set(
                                roleData.id,
                                role.id
                            );

                        }


                        // ==================================================
                        // RESTAURATION POSITIONS RÔLES
                        // ==================================================

                        for (
                            const roleData
                            of sortedRoles
                        ) {

                            if (
                                roleData.id ===
                                guild.id
                            ) {

                                continue;

                            }


                            const currentRoleId =
                                roleMap.get(
                                    roleData.id
                                );


                            if (
                                !currentRoleId
                            ) {

                                continue;

                            }


                            const role =
                                guild.roles.cache.get(
                                    currentRoleId
                                );


                            if (
                                !role ||
                                role.managed
                            ) {

                                continue;

                            }


                            try {

                                await role.setPosition(
                                    roleData.position,
                                    {
                                        reason:
                                            "Nebu Restore"
                                    }
                                );

                            } catch (
                                positionError
                            ) {

                                console.error(
                                    `⚠️ Position rôle ${role.name}:`,
                                    positionError.message
                                );

                            }

                        }


                        // ==================================================
                        // MAP DES SALONS
                        // ==================================================

                        const channelMap =
                            new Map();


                        // ==================================================
                        // CATÉGORIES
                        // ==================================================

                        const categories =
                            (
                                backup.channels ||
                                []
                            )
                            .filter(
                                channel =>
                                    channel.type ===
                                    ChannelType.GuildCategory
                            )
                            .sort(
                                (a, b) =>
                                    a.position -
                                    b.position
                            );


                        let restoredChannels =
                            0;


                        for (
                            const channelData
                            of categories
                        ) {

                            let channel =
                                guild.channels.cache.find(
                                    existingChannel =>
                                        existingChannel.name ===
                                            channelData.name &&
                                        existingChannel.type ===
                                            ChannelType.GuildCategory
                                );


                            if (
                                !channel
                            ) {

                                channel =
                                    await guild.channels.create({

                                        name:
                                            channelData.name,

                                        type:
                                            ChannelType.GuildCategory,

                                        reason:
                                            "Nebu Restore"

                                    });

                                restoredChannels++;

                            }


                            channelMap.set(
                                channelData.id,
                                channel.id
                            );

                        }


                        // ==================================================
                        // AUTRES SALONS
                        // ==================================================

                        const normalChannels =
                            (
                                backup.channels ||
                                []
                            )
                            .filter(
                                channel =>
                                    channel.type !==
                                    ChannelType.GuildCategory
                            )
                            .sort(
                                (a, b) =>
                                    a.position -
                                    b.position
                            );


                        for (
                            const channelData
                            of normalChannels
                        ) {

                            let channel =
                                guild.channels.cache.find(
                                    existingChannel =>
                                        existingChannel.name ===
                                            channelData.name &&
                                        existingChannel.type ===
                                            channelData.type
                                );


                            // ----------------------------------------------
                            // OPTIONS
                            // ----------------------------------------------

                            const channelOptions = {

                                name:
                                    channelData.name,

                                type:
                                    channelData.type,

                                reason:
                                    "Nebu Restore"

                            };


                            // ----------------------------------------------
                            // CATÉGORIE
                            // ----------------------------------------------

                            const parentId =
                                channelData.parentId
                                    ? channelMap.get(
                                        channelData.parentId
                                    )
                                    : null;


                            if (
                                parentId
                            ) {

                                channelOptions.parent =
                                    parentId;

                            }


                            // ----------------------------------------------
                            // TEXTE
                            // ----------------------------------------------

                            if (
                                channelData.topic !==
                                null &&
                                channelData.topic !==
                                undefined
                            ) {

                                channelOptions.topic =
                                    channelData.topic;

                            }


                            if (
                                channelData.nsfw !==
                                undefined
                            ) {

                                channelOptions.nsfw =
                                    channelData.nsfw;

                            }


                            if (
                                channelData.rateLimitPerUser !==
                                undefined
                            ) {

                                channelOptions.rateLimitPerUser =
                                    channelData.rateLimitPerUser;

                            }


                            // ----------------------------------------------
                            // VOCAL
                            // ----------------------------------------------

                            if (
                                channelData.bitrate
                            ) {

                                channelOptions.bitrate =
                                    channelData.bitrate;

                            }


                            if (
                                channelData.userLimit !==
                                null &&
                                channelData.userLimit !==
                                undefined
                            ) {

                                channelOptions.userLimit =
                                    channelData.userLimit;

                            }


                            // ----------------------------------------------
                            // CRÉATION
                            // ----------------------------------------------

                            if (
                                !channel
                            ) {

                                try {

                                    channel =
                                        await guild.channels.create(
                                            channelOptions
                                        );

                                    restoredChannels++;

                                } catch (
                                    channelError
                                ) {

                                    console.error(
                                        `⚠️ Impossible de créer #${channelData.name}:`,
                                        channelError.message
                                    );

                                    continue;

                                }

                            }


                            channelMap.set(
                                channelData.id,
                                channel.id
                            );


                            // ==================================================
                            // PERMISSIONS
                            // ==================================================

                            if (
                                channelData.permissionOverwrites
                            ) {

                                const overwrites = [];


                                for (
                                    const overwrite
                                    of channelData.permissionOverwrites
                                ) {

                                    const currentRoleId =
                                        roleMap.get(
                                            overwrite.id
                                        );


                                    if (
                                        !currentRoleId
                                    ) {

                                        continue;

                                    }


                                    overwrites.push({

                                        id:
                                            currentRoleId,

                                        type:
                                            overwrite.type,

                                        allow:
                                            BigInt(
                                                overwrite.allow
                                            ),

                                        deny:
                                            BigInt(
                                                overwrite.deny
                                            )

                                    });

                                }


                                if (
                                    overwrites.length > 0
                                ) {

                                    try {

                                        await channel.permissionOverwrites.set(

                                            overwrites,

                                            "Nebu Restore"

                                        );

                                    } catch (
                                        permissionError
                                    ) {

                                        console.error(
                                            `⚠️ Permissions #${channel.name}:`,
                                            permissionError.message
                                        );

                                    }

                                }

                            }

                        }


                        // ==================================================
                        // STATISTIQUES
                        // ==================================================

                        const totalRoles =
                            backup.roles?.length ||
                            0;

                        const totalChannels =
                            backup.channels?.length ||
                            0;


                        // ==================================================
                        // FIN
                        // ==================================================

                        await panel.edit({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        "#22C55E"
                                    )

                                    .setTitle(
                                        "✅ Restauration terminée"
                                    )

                                    .setDescription(

                                        `La sauvegarde **${selectedBackup}** a été restaurée.\n\n` +

                                        `🎭 Rôles dans la backup : **${totalRoles}**\n` +

                                        `🎭 Nouveaux rôles : **${restoredRoles}**\n\n` +

                                        `📁 Salons dans la backup : **${totalChannels}**\n` +

                                        `📁 Nouveaux salons : **${restoredChannels}**\n\n` +

                                        `🔐 Les permissions disponibles ont également été restaurées.`

                                    )

                            ],

                            components: []

                        });


                        console.log(
                            `🛡️ RESTORE | ${message.author.tag} | ${guild.name} | ${selectedBackup}`
                        );


                    } catch (
                        error
                    ) {

                        console.error(
                            "❌ ERREUR RESTORE :",
                            error
                        );


                        await panel.edit({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        "#EF4444"
                                    )

                                    .setTitle(
                                        "❌ Erreur de restauration"
                                    )

                                    .setDescription(
                                        "Une erreur est survenue pendant la restauration.\n\n" +
                                        "Consulte la console du bot pour voir l'erreur."
                                    )

                            ],

                            components: []

                        });

                    }


                    collector.stop();

                }

            }
        );


        // ==================================================
        // EXPIRATION
        // ==================================================

        collector.on(
            "end",
            async () => {

                try {

                    await panel.edit({

                        components: []

                    });

                } catch {}

            }
        );

    }

};