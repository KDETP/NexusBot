const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const manager = require("../services/announcementManager");

const STAFF_ROLE_IDS = [
    "1457855405370900662",
    "1452142914099478630"
];

function isStaff(interaction) {
    return Boolean(
        interaction.member &&
        interaction.member.roles &&
        interaction.member.roles.cache &&
        interaction.member.roles.cache.some(role => STAFF_ROLE_IDS.includes(role.id))
    );
}

function makeEmbed(draft, guild) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(draft.title || "Nouvelle annonce")
        .setDescription(draft.description || " ")
        .setFooter({
            text: guild.name,
            ...(guild.iconURL() ? { iconURL: guild.iconURL() } : {})
        })
        .setTimestamp();

    if (draft.image) embed.setImage(draft.image);
    return embed;
}

function makeLinkRow(draft) {
    if (!draft.link) return [];
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Ouvrir le lien")
                .setURL(draft.link)
        )
    ];
}

module.exports = async (client, interaction) => {
    if (!interaction.customId || !interaction.customId.startsWith("annonce_")) return false;

    if (!interaction.guild) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "Cette interaction doit etre utilisee sur un serveur.", ephemeral: true });
        }
        return true;
    }

    if (!isStaff(interaction)) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "Tu n'as pas la permission d'utiliser ce panneau.",
                ephemeral: true
            });
        }
        return true;
    }

    const draft = manager.getSession(interaction.guild.id, interaction.user.id);
    if (!draft) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "Brouillon introuvable ou expire. Relance `nannonce`.",
                ephemeral: true
            });
        }
        return true;
    }

    const id = interaction.customId;

    if (id === "annonce_channel" && interaction.isChannelSelectMenu()) {
        draft.channelId = interaction.values[0];
        return interaction.update({
            content: `Salon choisi : <#${draft.channelId}>.\nConfigure le contenu, puis previsualise et publie.`,
            components: interaction.message.components
        });
    }

    if (id === "annonce_config" && interaction.isButton()) {
        const modal = new ModalBuilder()
            .setCustomId("annonce_modal")
            .setTitle("Configurer l'annonce");

        const titleInput = new TextInputBuilder()
            .setCustomId("annonce_title")
            .setLabel("Titre")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(256)
            .setValue(draft.title || "Nouvelle annonce");

        const descriptionInput = new TextInputBuilder()
            .setCustomId("annonce_description")
            .setLabel("Description de l'embed")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000)
            .setValue(draft.description || " ");

        const contentInput = new TextInputBuilder()
            .setCustomId("annonce_content")
            .setLabel("Message texte (optionnel)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(2000)
            .setValue(draft.content || "");

        const imageInput = new TextInputBuilder()
            .setCustomId("annonce_image")
            .setLabel("URL de l'image (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(1000)
            .setValue(draft.image || "");

        const linkInput = new TextInputBuilder()
            .setCustomId("annonce_link")
            .setLabel("URL du bouton (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(1000)
            .setValue(draft.link || "");

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(contentInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(linkInput)
        );

        return interaction.showModal(modal);
    }

    if (id === "annonce_modal" && interaction.isModalSubmit()) {
        draft.title = interaction.fields.getTextInputValue("annonce_title").trim();
        draft.description = interaction.fields.getTextInputValue("annonce_description").trim();
        draft.content = interaction.fields.getTextInputValue("annonce_content").trim();
        draft.image = interaction.fields.getTextInputValue("annonce_image").trim();
        draft.link = interaction.fields.getTextInputValue("annonce_link").trim();

        for (const [label, url] of [["image", draft.image], ["lien", draft.link]]) {
            if (!url) continue;
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("URL invalide");
            } catch (_) {
                return interaction.reply({
                    content: `L'URL de ${label} est invalide. Utilise une adresse commencant par https:// ou http://, puis reconfigure l'annonce.`,
                    ephemeral: true
                });
            }
        }

        return interaction.reply({
            content: "Contenu enregistre. Tu peux maintenant previsualiser l'annonce.",
            ephemeral: true
        });
    }

    if (id === "annonce_preview" && interaction.isButton()) {
        return interaction.reply({
            content: "Previsualisation de l'annonce :",
            embeds: [makeEmbed(draft, interaction.guild)],
            components: makeLinkRow(draft),
            ephemeral: true
        });
    }

    if (id === "annonce_publish" && interaction.isButton()) {
        if (!draft.channelId) {
            return interaction.reply({ content: "Choisis d'abord un salon de publication.", ephemeral: true });
        }

        const channel = await interaction.guild.channels.fetch(draft.channelId).catch(() => null);
        if (!channel || !channel.isTextBased() || !channel.send) {
            return interaction.reply({ content: "Le salon selectionne est introuvable ou ne permet pas d'envoyer des messages.", ephemeral: true });
        }

        const botMember = interaction.guild.members.me;
        if (!botMember || !channel.permissionsFor(botMember)?.has("SendMessages")) {
            return interaction.reply({ content: "Je n'ai pas la permission d'envoyer un message dans ce salon.", ephemeral: true });
        }

        const payload = {
            content: [draft.content, `<@&${draft.roleId || ""}>`].filter(Boolean).join("\n"),
            embeds: [makeEmbed(draft, interaction.guild)],
            components: makeLinkRow(draft),
            allowedMentions: {
                roles: draft.roleId ? [draft.roleId] : [],
                parse: []
            }
        };

        // Ne mentionne que le role selectionne dans le brouillon, jamais les autres roles.
        if (!draft.roleId) {
            payload.content = draft.content || "";
            payload.allowedMentions.roles = [];
        }

        await channel.send(payload);
        manager.deleteSession(interaction.guild.id, interaction.user.id);

        return interaction.update({
            content: `Annonce publiee dans <#${channel.id}>.`,
            components: []
        });
    }

    if (id === "annonce_cancel" && interaction.isButton()) {
        manager.deleteSession(interaction.guild.id, interaction.user.id);
        return interaction.update({
            content: "Creation de l'annonce annulee.",
            components: []
        });
    }

    return true;
};