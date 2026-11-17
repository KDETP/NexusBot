const {
    AuditLogEvent,
    EmbedBuilder,
    Events
} = require("discord.js");

const LOG_CHANNEL_ID = "1534951215413067876";
const AUDIT_LOOKBACK_MS = 20_000;
const MAX_FIELD_LENGTH = 1_000;

const COLORS = {
    moderation: 0xED4245,
    members: 0x57F287,
    messages: 0x5865F2,
    voice: 0xEB459E,
    server: 0xFEE75C,
    automod: 0xFAA61A,
    errors: 0x992D22
};

function clean(value, max = MAX_FIELD_LENGTH) {
    const text = String(value ?? "—").replace(/```/g, "''' ").trim();
    return text.length > max ? `${text.slice(0, max - 3)}...` : text || "—";
}

function userLabel(user) {
    return user ? `${user.tag ?? user.username} (${user.id})` : "Inconnu";
}

function channelLabel(channel) {
    return channel ? `#${channel.name ?? channel.id} (${channel.id})` : "Inconnu";
}

function attachmentList(message) {
    return [...(message.attachments?.values?.() ?? [])]
        .map(item => `${item.name ?? "fichier"}: ${item.url}`)
        .join("\n");
}

async function findAuditEntry(guild, type, targetId, extra = {}) {
    if (!guild || !type) return null;

    try {
        const logs = await guild.fetchAuditLogs({ type, limit: 6 });
        return logs.entries.find(entry => {
            if (targetId && entry.target?.id !== targetId) return false;
            if (Date.now() - entry.createdTimestamp > AUDIT_LOOKBACK_MS) return false;
            if (extra.channelId && entry.extra?.channel?.id !== extra.channelId) return false;
            return true;
        }) ?? null;
    } catch (error) {
        console.warn(`[LOGS] Lecture des Audit Logs impossible (${guild.id}): ${error.message}`);
        return null;
    }
}

function auditFields(entry) {
    return [
        { name: "Effectué par", value: userLabel(entry?.executor), inline: true },
        { name: "Motif", value: clean(entry?.reason, 900), inline: true }
    ];
}

function createServerLogger(client) {
    const recentMessages = new Map();

    function rememberMessage(message) {
        if (!message.guild || message.author?.bot || message.channelId === LOG_CHANNEL_ID) return;
        recentMessages.set(message.id, {
            content: message.content,
            author: message.author,
            guild: message.guild,
            channel: message.channel,
            channelId: message.channelId,
            url: message.url,
            attachments: attachmentList(message)
        });
        if (recentMessages.size > 10_000) {
            recentMessages.delete(recentMessages.keys().next().value);
        }
    }

    async function log(guild, category, title, description, fields = [], color = COLORS[category] ?? COLORS.server) {
        const timestamp = new Date();
        const safeDescription = clean(description, 4_000);

        console.log(`[${category.toUpperCase()}] ${title} | ${safeDescription}`);
        for (const field of fields) {
            console.log(`  ${field.name}: ${field.value}`);
        }

        try {
            const channel = guild
                ? await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null)
                : await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (!channel?.isTextBased?.()) {
                if (!channel) console.warn(`[LOGS] Salon ${LOG_CHANNEL_ID} introuvable${guild ? ` sur ${guild.name}` : ""}.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(clean(title, 256))
                .setDescription(safeDescription)
                .setTimestamp(timestamp)
                .setFooter({ text: guild ? `${guild.name} • ${guild.id}` : `${client.user?.tag ?? "NexusBot"} • erreur du bot` });

            const validFields = fields
                .filter(field => field?.name && field?.value)
                .slice(0, 25)
                .map(field => ({
                    name: clean(field.name, 256),
                    value: clean(field.value, 1_000),
                    inline: Boolean(field.inline)
                }));
            if (validFields.length) embed.addFields(validFields);

            await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
        } catch (error) {
            console.error(`[LOGS] Envoi impossible dans ${LOG_CHANNEL_ID}:`, error);
        }
    }

    async function logMessageDelete(message) {
        const cached = recentMessages.get(message.id);
        recentMessages.delete(message.id);
        const guild = message.guild ?? cached?.guild;
        const author = message.author ?? cached?.author;
        if (!guild || message.channelId === LOG_CHANNEL_ID || author?.bot) return;
        const audit = await findAuditEntry(
            guild,
            AuditLogEvent.MessageDelete,
            author?.id,
            { channelId: message.channelId }
        );
        const files = attachmentList(message) || cached?.attachments;
        await log(guild, "messages", "Message supprimé", `Auteur : ${userLabel(author)}\nSalon : ${channelLabel(message.channel ?? cached?.channel)}`,
            [
                { name: "Contenu", value: clean(message.content ?? cached?.content ?? "(non disponible : message absent du cache)") },
                ...(files ? [{ name: "Fichiers joints", value: clean(files) }] : []),
                ...auditFields(audit)
            ]);
    }

    client.on(Events.MessageCreate, message => {
        rememberMessage(message);
        if (!message.guild || message.channelId === LOG_CHANNEL_ID || message.author?.bot) return;
        const files = attachmentList(message);
        void log(message.guild, "messages", "Message reçu",
            `Auteur : ${userLabel(message.author)}\nSalon : ${channelLabel(message.channel)}\nLien : ${message.url}`,
            [
                { name: "Contenu", value: clean(message.content || "(aucun texte)") },
                ...(files ? [{ name: "Fichiers joints", value: clean(files) }] : [])
            ]).catch(error => console.error("[LOGS] MessageCreate:", error));
    });

    client.on(Events.MessageDelete, message => {
        void logMessageDelete(message).catch(error => console.error("[LOGS] MessageDelete:", error));
    });

    client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
        void (async () => {
            const cached = recentMessages.get(newMessage.id);
            const before = oldMessage.partial ? await oldMessage.fetch().catch(() => null) : oldMessage;
            const after = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
            const guild = after?.guild ?? cached?.guild;
            const author = after?.author ?? cached?.author;
            if (!guild || after?.channelId === LOG_CHANNEL_ID || author?.bot) return;
            const oldContent = (oldMessage.partial ? cached?.content : before?.content) ?? cached?.content;
            if (oldContent === after?.content) return;
            await log(guild, "messages", "Message modifié",
                `Auteur : ${userLabel(author)}\nSalon : ${channelLabel(after?.channel ?? cached?.channel)}\nLien : ${after?.url ?? cached?.url ?? "Inconnu"}`,
                [
                    { name: "Avant", value: clean(oldContent ?? "(non disponible : message absent du cache)") },
                    { name: "Après", value: clean(after?.content ?? "(vide)") }
                ]);
            if (after) rememberMessage(after);
        })().catch(error => console.error("[LOGS] MessageUpdate:", error));
    });

    client.on(Events.MessageBulkDelete, messages => {
        const first = messages.first();
        if (!first?.guild || first.channelId === LOG_CHANNEL_ID) return;
        void log(first.guild, "messages", "Messages supprimés en masse",
            `${messages.size} messages supprimés dans ${channelLabel(first.channel)}.`)
            .catch(error => console.error("[LOGS] MessageDeleteBulk:", error));
    });

    client.on(Events.GuildMemberAdd, member => {
        void log(member.guild, "members", "Membre arrivé", `${userLabel(member.user)} a rejoint le serveur.`);
    });

    client.on(Events.GuildMemberRemove, member => {
        void (async () => {
            const ban = await findAuditEntry(member.guild, AuditLogEvent.MemberBanAdd, member.id);
            if (ban) return; // GuildBanAdd envoie le journal de ban dédié.
            const kick = await findAuditEntry(member.guild, AuditLogEvent.MemberKick, member.id);
            if (kick) {
                await log(member.guild, "moderation", "Membre expulsé", userLabel(member.user), auditFields(kick));
                return;
            }
            await log(member.guild, "members", "Membre parti", userLabel(member.user));
        })().catch(error => console.error("[LOGS] GuildMemberRemove:", error));
    });

    client.on(Events.GuildBanAdd, ban => {
        void (async () => {
            const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
            await log(ban.guild, "moderation", "Ban ajouté", userLabel(ban.user), auditFields(entry));
        })().catch(error => console.error("[LOGS] GuildBanAdd:", error));
    });

    client.on(Events.GuildBanRemove, ban => {
        void (async () => {
            const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
            await log(ban.guild, "moderation", "Ban retiré", userLabel(ban.user), auditFields(entry));
        })().catch(error => console.error("[LOGS] GuildBanRemove:", error));
    });

    client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
        void (async () => {
            const added = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removed = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
            if (added.size || removed.size) {
                const entry = await findAuditEntry(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
                await log(newMember.guild, "members", "Rôles du membre modifiés", userLabel(newMember.user), [
                    ...(added.size ? [{ name: "Ajoutés", value: added.map(role => role.name).join(", ") }] : []),
                    ...(removed.size ? [{ name: "Retirés", value: removed.map(role => role.name).join(", ") }] : []),
                    ...auditFields(entry)
                ]);
            }
            if (oldMember.nickname !== newMember.nickname) {
                const entry = await findAuditEntry(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);
                await log(newMember.guild, "members", "Surnom modifié", userLabel(newMember.user), [
                    { name: "Avant", value: oldMember.nickname ?? "Aucun" },
                    { name: "Après", value: newMember.nickname ?? "Aucun" },
                    ...auditFields(entry)
                ]);
            }
            const wasTimedOut = Boolean(oldMember.communicationDisabledUntilTimestamp && oldMember.communicationDisabledUntilTimestamp > Date.now());
            const isTimedOut = Boolean(newMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp > Date.now());
            if (wasTimedOut !== isTimedOut || oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
                const entry = await findAuditEntry(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);
                await log(newMember.guild, "moderation", isTimedOut ? "Timeout appliqué ou modifié" : "Timeout retiré",
                    userLabel(newMember.user), [
                        { name: "Fin du timeout", value: isTimedOut ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>` : "Aucune" },
                        ...auditFields(entry)
                    ]);
            }
        })().catch(error => console.error("[LOGS] GuildMemberUpdate:", error));
    });

    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
        const member = newState.member ?? oldState.member;
        if (!member || member.user.bot) return;
        let action;
        if (!oldState.channelId && newState.channelId) action = `a rejoint ${channelLabel(newState.channel)}`;
        else if (oldState.channelId && !newState.channelId) action = `a quitté ${channelLabel(oldState.channel)}`;
        else if (oldState.channelId !== newState.channelId) action = `a été déplacé de ${channelLabel(oldState.channel)} vers ${channelLabel(newState.channel)}`;
        else if (oldState.serverMute !== newState.serverMute) action = newState.serverMute ? "a été mute par le serveur" : "n'est plus mute par le serveur";
        else if (oldState.serverDeaf !== newState.serverDeaf) action = newState.serverDeaf ? "a été deaf par le serveur" : "n'est plus deaf par le serveur";
        else if (oldState.selfMute !== newState.selfMute || oldState.selfDeaf !== newState.selfDeaf) action = "a modifié son mute/deaf vocal";
        else if (oldState.streaming !== newState.streaming || oldState.selfVideo !== newState.selfVideo) action = "a modifié son partage vidéo/stream";
        if (!action) return;
        void (async () => {
            let audit = null;
            if (oldState.channelId !== newState.channelId && oldState.channelId && newState.channelId) {
                audit = await findAuditEntry(member.guild, AuditLogEvent.MemberMove, member.id);
            } else if (oldState.channelId && !newState.channelId) {
                audit = await findAuditEntry(member.guild, AuditLogEvent.MemberDisconnect, member.id);
            }
            await log(member.guild, "voice", "Activité vocale", `${userLabel(member.user)} ${action}`, audit ? auditFields(audit) : []);
        })().catch(error => console.error("[LOGS] VoiceStateUpdate:", error));
    });

    client.on(Events.ChannelCreate, channel => {
        if (channel.guild) void (async () => {
            const entry = await findAuditEntry(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
            await log(channel.guild, "server", "Salon créé", channelLabel(channel), auditFields(entry));
        })();
    });
    client.on(Events.ChannelDelete, channel => {
        if (channel.guild && channel.id !== LOG_CHANNEL_ID) void (async () => {
            const entry = await findAuditEntry(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
            await log(channel.guild, "server", "Salon supprimé", channelLabel(channel), auditFields(entry));
        })();
    });
    client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
        if (!newChannel.guild || newChannel.id === LOG_CHANNEL_ID) return;
        const changes = [];
        for (const key of ["name", "topic", "parentId", "rateLimitPerUser", "nsfw", "bitrate", "userLimit"]) {
            if (oldChannel[key] !== newChannel[key]) changes.push({ name: key, value: `${clean(oldChannel[key])} → ${clean(newChannel[key])}` });
        }
        if (oldChannel.permissionOverwrites?.cache && newChannel.permissionOverwrites?.cache) {
            const before = oldChannel.permissionOverwrites.cache;
            const after = newChannel.permissionOverwrites.cache;
            const overwriteChanges = new Set([...before.keys(), ...after.keys()]);
            const changed = [...overwriteChanges].filter(id => {
                const left = before.get(id);
                const right = after.get(id);
                return !left || !right || left.allow.bitfield !== right.allow.bitfield || left.deny.bitfield !== right.deny.bitfield;
            });
            if (changed.length) changes.push({
                name: "Permissions modifiées (rôle/membre)",
                value: changed.map(id => `${id}${before.has(id) && after.has(id) ? " (règles modifiées)" : after.has(id) ? " (ajoutées)" : " (retirées)"}`).join(", ")
            });
        }
        if (changes.length) void (async () => {
            const entry = await findAuditEntry(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);
            await log(newChannel.guild, "server", "Salon modifié", channelLabel(newChannel), [...changes, ...auditFields(entry)]);
        })();
    });

    client.on(Events.GuildRoleCreate, role => {
        void (async () => {
            const entry = await findAuditEntry(role.guild, AuditLogEvent.RoleCreate, role.id);
            await log(role.guild, "server", "Rôle créé", role.name, [{ name: "ID", value: role.id }, ...auditFields(entry)]);
        })();
    });
    client.on(Events.GuildRoleDelete, role => {
        void (async () => {
            const entry = await findAuditEntry(role.guild, AuditLogEvent.RoleDelete, role.id);
            await log(role.guild, "server", "Rôle supprimé", role.name, [{ name: "ID", value: role.id }, ...auditFields(entry)]);
        })();
    });
    client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
        const changes = [];
        for (const key of ["name", "color", "hoist", "mentionable", "position"]) {
            if (oldRole[key] !== newRole[key]) changes.push({ name: key, value: `${clean(oldRole[key])} → ${clean(newRole[key])}` });
        }
        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            changes.push({ name: "Permissions", value: `${oldRole.permissions.bitfield} → ${newRole.permissions.bitfield}` });
        }
        if (changes.length) void (async () => {
            const entry = await findAuditEntry(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
            await log(newRole.guild, "server", "Rôle modifié", newRole.name, [...changes, ...auditFields(entry)]);
        })();
    });

    client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
        const changes = [];
        for (const key of ["name", "description", "verificationLevel", "explicitContentFilter", "preferredLocale"]) {
            if (oldGuild[key] !== newGuild[key]) changes.push({ name: key, value: `${clean(oldGuild[key])} → ${clean(newGuild[key])}` });
        }
        if (changes.length) void log(newGuild, "server", "Paramètres du serveur modifiés", newGuild.name, changes);
    });

    client.on(Events.GuildEmojiCreate, emoji => {
        void log(emoji.guild, "server", "Émoji ajouté", emoji.name, [{ name: "ID", value: emoji.id }]);
    });
    client.on(Events.GuildEmojiDelete, emoji => {
        void log(emoji.guild, "server", "Émoji supprimé", emoji.name, [{ name: "ID", value: emoji.id }]);
    });
    client.on(Events.GuildEmojiUpdate, (oldEmoji, newEmoji) => {
        if (oldEmoji.name !== newEmoji.name) void log(newEmoji.guild, "server", "Émoji renommé", `${oldEmoji.name} → ${newEmoji.name}`);
    });
    client.on(Events.GuildStickerCreate, sticker => {
        if (sticker.guild) void log(sticker.guild, "server", "Sticker ajouté", sticker.name, [{ name: "ID", value: sticker.id }]);
    });
    client.on(Events.GuildStickerDelete, sticker => {
        if (sticker.guild) void log(sticker.guild, "server", "Sticker supprimé", sticker.name, [{ name: "ID", value: sticker.id }]);
    });
    client.on(Events.GuildStickerUpdate, (oldSticker, newSticker) => {
        if (newSticker.guild && oldSticker.name !== newSticker.name) {
            void log(newSticker.guild, "server", "Sticker renommé", `${oldSticker.name} → ${newSticker.name}`);
        }
    });

    client.on(Events.InviteCreate, invite => {
        if (invite.guild) void log(invite.guild, "server", "Invitation créée", `Code : ${invite.code}`, [
            { name: "Créée par", value: userLabel(invite.inviter) },
            { name: "Salon", value: channelLabel(invite.channel) }
        ]);
    });
    client.on(Events.InviteDelete, invite => {
        if (invite.guild) void log(invite.guild, "server", "Invitation supprimée", `Code : ${invite.code}`, [{ name: "Salon", value: channelLabel(invite.channel) }]);
    });

    client.on(Events.ThreadCreate, thread => {
        if (thread.guild && !thread.parentId?.includes(LOG_CHANNEL_ID)) void log(thread.guild, "server", "Fil créé", thread.name, [{ name: "Salon parent", value: channelLabel(thread.parent) }]);
    });
    client.on(Events.ThreadDelete, thread => {
        if (thread.guild) void log(thread.guild, "server", "Fil supprimé", thread.name, [{ name: "Salon parent", value: channelLabel(thread.parent) }]);
    });
    client.on(Events.ThreadUpdate, (oldThread, newThread) => {
        if (oldThread.name !== newThread.name) void log(newThread.guild, "server", "Fil renommé", `${oldThread.name} → ${newThread.name}`);
    });

    client.on(Events.AutoModerationActionExecution, execution => {
        void log(execution.guild, "automod", "Action AutoMod déclenchée",
            `Règle : ${execution.ruleName ?? execution.ruleId}\nAction : ${execution.action?.type ?? "Inconnue"}`,
            [
                { name: "Membre", value: userLabel(execution.user) },
                { name: "Salon", value: channelLabel(execution.channel) },
                ...(execution.matchedContent ? [{ name: "Contenu correspondant", value: clean(execution.matchedContent) }] : []),
                ...(execution.alertSystemMessageId ? [{ name: "Message d'alerte", value: execution.alertSystemMessageId }] : [])
            ]);
    });

    client.on(Events.AutoModerationRuleCreate, rule => {
        void log(rule.guild, "automod", "Règle AutoMod créée", rule.name, [{ name: "ID", value: rule.id }]);
    });
    client.on(Events.AutoModerationRuleDelete, rule => {
        void log(rule.guild, "automod", "Règle AutoMod supprimée", rule.name, [{ name: "ID", value: rule.id }]);
    });
    client.on(Events.AutoModerationRuleUpdate, (oldRule, newRule) => {
        void log(newRule.guild, "automod", "Règle AutoMod modifiée", newRule.name, [
            { name: "ID", value: newRule.id },
            ...(oldRule && oldRule.enabled !== newRule.enabled ? [{ name: "Activée", value: `${oldRule.enabled} → ${newRule.enabled}` }] : [])
        ]);
    });

    client.on(Events.GuildScheduledEventCreate, scheduledEvent => {
        void log(scheduledEvent.guild, "server", "Événement planifié créé", scheduledEvent.name, [{ name: "Début", value: `<t:${Math.floor(scheduledEvent.scheduledStartTimestamp / 1000)}:F>` }]);
    });
    client.on(Events.GuildScheduledEventDelete, scheduledEvent => {
        void log(scheduledEvent.guild, "server", "Événement planifié supprimé", scheduledEvent.name);
    });
    client.on(Events.GuildScheduledEventUpdate, (oldEvent, newEvent) => {
        const changes = [];
        for (const key of ["name", "description", "status", "entityType"]) {
            if (oldEvent?.[key] !== newEvent[key]) changes.push({ name: key, value: `${clean(oldEvent?.[key])} → ${clean(newEvent[key])}` });
        }
        if (changes.length) void log(newEvent.guild, "server", "Événement planifié modifié", newEvent.name, changes);
    });

    client.on(Events.Error, error => {
        void log(null, "errors", "Erreur Discord.js", clean(error?.stack ?? error, 4_000));
    });
    client.on(Events.ShardError, (error, shardId) => {
        void log(null, "errors", `Erreur du shard ${shardId}`, clean(error?.stack ?? error, 4_000));
    });
    client.on(Events.Warn, warning => {
        void log(null, "errors", "Avertissement Discord.js", clean(warning, 4_000));
    });

    console.log(`[LOGS] Système de journalisation chargé. Salon Discord : ${LOG_CHANNEL_ID}`);
}

module.exports = { createServerLogger };
