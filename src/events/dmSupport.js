const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    MessageFlags
} = require("discord.js");

const db = require("../database/database");

const LOG_CHANNEL_ID = "1534951215413067876";
const STAFF_ROLE_ID = "1457855405370900662";
const HISTORY_LIMIT = 8;

const schemaReady = new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS dm_support (
                userId TEXT PRIMARY KEY,
                logChannelId TEXT NOT NULL,
                logMessageId TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL
            )
        `, error => {
            if (error) return reject(error);
            db.run(`
                CREATE TABLE IF NOT EXISTS dm_support_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    authorId TEXT NOT NULL,
                    content TEXT,
                    attachments TEXT,
                    createdAt INTEGER NOT NULL
                )
            `, secondError => secondError ? reject(secondError) : resolve());
        });
    });
});

const queues = new Map();

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) return reject(error);
            resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null));
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || []));
    });
}

function clean(value, max = 900) {
    const text = String(value ?? "").replace(/```/g, "[code]").trim() || "—";
    return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

async function saveMessage(userId, direction, authorId, content, attachments = "") {
    await run(
        `INSERT INTO dm_support_messages
         (userId, direction, authorId, content, attachments, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, direction, authorId, content || "", attachments || "", Date.now()]
    );
}

async function getConversation(userId) {
    return get("SELECT * FROM dm_support WHERE userId = ?", [userId]);
}

async function setConversation(userId, channelId, messageId) {
    const now = Date.now();
    await run(
        `INSERT INTO dm_support
         (userId, logChannelId, logMessageId, status, createdAt, updatedAt)
         VALUES (?, ?, ?, 'open', ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
         logChannelId = excluded.logChannelId,
         logMessageId = excluded.logMessageId,
         status = 'open',
         updatedAt = excluded.updatedAt`,
        [userId, channelId, messageId, now, now]
    );
}

async function getHistory(userId) {
    const rows = await all(
        `SELECT direction, authorId, content, attachments, createdAt
         FROM dm_support_messages WHERE userId = ?
         ORDER BY id DESC LIMIT ?`,
        [userId, HISTORY_LIMIT]
    );
    return rows.reverse();
}

async function makeEmbed(user, closed = false) {
    const history = await getHistory(user.id);
    const lines = history.map(item => {
        const time = `<t:${Math.floor(item.createdAt / 1000)}:t>`;
        const who = item.direction === "in"
            ? `📨 ${clean(user.username, 80)}`
            : `💬 Staff (<@${item.authorId}>)`;
        return `**${who}** · ${time}\n${clean(item.content, 350)}` +
            (item.attachments ? `\n${clean(item.attachments, 300)}` : "");
    });

    let transcript = "";
    for (const line of lines) {
        const next = transcript ? `${transcript}\n\n${line}` : line;
        if (next.length > 3300) break;
        transcript = next;
    }

    const embed = new EmbedBuilder()
        .setColor(closed ? 0x747F8D : 0x5865F2)
        .setTitle(closed ? "🔒 Conversation DM fermée" : "📩 Conversation DM ouverte")
        .setDescription(
            `**Utilisateur :** <@${user.id}> (${clean(user.tag || user.username, 100)})\n` +
            `**ID :** \`${user.id}\`\n\n**Historique récent :**\n${transcript || "Aucun message."}`
        )
        .setFooter({ text: closed ? "NexusBot DM Support • Fermé" : "NexusBot DM Support • Ouvert" })
        .setTimestamp();

    const avatar = user.displayAvatarURL?.({ size: 128 });
    if (avatar) embed.setThumbnail(avatar);
    return embed;
}

function makeButtons(userId) {
    return [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`dmsupport_reply:${userId}`)
            .setLabel("Répondre")
            .setEmoji("💬")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`dmsupport_close:${userId}`)
            .setLabel("Fermer")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Secondary)
    )];
}

function getAttachments(message) {
    return [...message.attachments.values()].slice(0, 5)
        .map(file => `• ${clean(file.name || "Fichier", 100)} : ${file.url}`)
        .join("\n");
}

async function processDM(client, message) {
    await schemaReady;

    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased?.() || !channel.send || !channel.messages) {
        console.error(`[DM SUPPORT] Salon ${LOG_CHANNEL_ID} inaccessible.`);
        return;
    }

    const attachments = getAttachments(message);
    const content = message.content?.trim() ||
        (attachments ? "(Pièce jointe sans texte)" : "(Message vide)");

    const existing = await getConversation(message.author.id);

    // Une conversation fermée qui reprend repart avec un nouvel historique.
    if (existing && existing.status !== "open") {
        await run(
            "DELETE FROM dm_support_messages WHERE userId = ?",
            [message.author.id]
        );
    }

    await saveMessage(message.author.id, "in", message.author.id, content, attachments);

    if (existing?.status === "open") {
        const oldLog = await channel.messages.fetch(existing.logMessageId).catch(() => null);
        if (oldLog) {
            await oldLog.edit({
                embeds: [await makeEmbed(message.author)],
                components: makeButtons(message.author.id),
                allowedMentions: { parse: [] }
            });
            await run("UPDATE dm_support SET updatedAt = ? WHERE userId = ?",
                [Date.now(), message.author.id]);
            return;
        }
    }

    const sent = await channel.send({
        embeds: [await makeEmbed(message.author)],
        components: makeButtons(message.author.id),
        allowedMentions: { parse: [] }
    });
    await setConversation(message.author.id, channel.id, sent.id);

    await message.author.send(
        "Merci pour ton message. Il a été transmis à l'équipe de modération de Nébulae, qui pourra te répondre ici. Les messages envoyés à ce bot sont consultables par le staff autorisé."
    ).catch(() => null);
}

function onDM(client, message) {
    if (message.guild || message.author?.bot) return;

    const userId = message.author.id;
    const previous = queues.get(userId) || Promise.resolve();
    const current = previous.catch(() => null)
        .then(() => processDM(client, message))
        .catch(error => console.error("[DM SUPPORT] Erreur :", error));

    queues.set(userId, current);
    current.finally(() => {
        if (queues.get(userId) === current) queues.delete(userId);
    });
}

async function isStaff(interaction) {
    if (!interaction.inGuild()) return false;
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    return Boolean(member?.roles.cache.has(STAFF_ROLE_ID));
}

async function handleInteraction(client, interaction) {
    const id = interaction.customId || "";
    if (!id.startsWith("dmsupport_")) return false;

    if (!interaction.inGuild() || interaction.channelId !== LOG_CHANNEL_ID) {
        await interaction.reply({ content: "Action disponible uniquement dans le salon DM Support.", flags: MessageFlags.Ephemeral });
        return true;
    }

    if (!await isStaff(interaction)) {
        await interaction.reply({ content: "Seul le rôle autorisé peut répondre aux DM.", flags: MessageFlags.Ephemeral });
        return true;
    }

    await schemaReady;

    const split = id.indexOf(":");
    const action = split < 0 ? id : id.slice(0, split);
    const userId = split < 0 ? "" : id.slice(split + 1);

    if (!/^\d{17,20}$/.test(userId)) {
        await interaction.reply({ content: "Conversation invalide.", flags: MessageFlags.Ephemeral });
        return true;
    }

    const conversation = await getConversation(userId);
    if (!conversation || conversation.status !== "open") {
        await interaction.reply({ content: "Conversation introuvable ou déjà fermée.", flags: MessageFlags.Ephemeral });
        return true;
    }

    if (action === "dmsupport_reply" && interaction.isButton()) {
        const modal = new ModalBuilder()
            .setCustomId(`dmsupport_send:${userId}`)
            .setTitle("Répondre au message privé");
        const input = new TextInputBuilder()
            .setCustomId("dmsupport_text")
            .setLabel("Message à envoyer")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1900);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return true;
    }

    if (action === "dmsupport_send" && interaction.isModalSubmit()) {
        const text = interaction.fields.getTextInputValue("dmsupport_text").trim();
        if (!text) {
            await interaction.reply({ content: "Le message ne peut pas être vide.", flags: MessageFlags.Ephemeral });
            return true;
        }

        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            await interaction.reply({ content: "Utilisateur introuvable.", flags: MessageFlags.Ephemeral });
            return true;
        }

        try {
            await user.send({ content: text, allowedMentions: { parse: [] } });
        } catch {
            await interaction.reply({
                content: "Impossible d'envoyer le DM : l'utilisateur a peut-être fermé ses messages privés.",
                flags: MessageFlags.Ephemeral
            });
            return true;
        }

        await saveMessage(userId, "out", interaction.user.id, text);
        const embed = await makeEmbed(user);
        await interaction.message.edit({
            embeds: [embed],
            components: makeButtons(userId),
            allowedMentions: { parse: [] }
        }).catch(error => console.error("[DM SUPPORT] Mise à jour du panneau :", error));

        await run("UPDATE dm_support SET updatedAt = ? WHERE userId = ?",
            [Date.now(), userId]);

        await interaction.reply({ content: "Réponse envoyée en DM.", flags: MessageFlags.Ephemeral });
        return true;
    }

    if (action === "dmsupport_close" && interaction.isButton()) {
        await run(
            "UPDATE dm_support SET status = 'closed', updatedAt = ? WHERE userId = ?",
            [Date.now(), userId]
        );

        const user = await client.users.fetch(userId).catch(() => ({ id: userId, username: userId }));
        await interaction.update({
            embeds: [await makeEmbed(user, true)],
            components: []
        });
        return true;
    }

    await interaction.reply({ content: "Action DM Support inconnue.", flags: MessageFlags.Ephemeral });
    return true;
}

function createDMSupport(client) {
    client.on(Events.MessageCreate, message => onDM(client, message));
    console.log(`[DM SUPPORT] Chargé • Salon ${LOG_CHANNEL_ID} • Rôle ${STAFF_ROLE_ID}`);
}

module.exports = { createDMSupport, handleInteraction };
