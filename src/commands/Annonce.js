const {
    ChannelType,
    ChannelSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const manager = require("../services/announcementManager");

const STAFF_ROLE_IDS = [
    "1457855405370900662",
    "1452142914099478630"
];

module.exports = {
    name: "annonce",

    async execute(message) {
        if (!message.guild || !message.member) return;

        const isStaff = message.member.roles.cache.some(role =>
            STAFF_ROLE_IDS.includes(role.id)
        );

        if (!isStaff) {
            return message.reply({
                content: "Tu n'as pas la permission d'utiliser cette commande.",
                allowedMentions: { repliedUser: false }
            });
        }

        // Cree/remplace le brouillon avec la meme cle utilisee par le gestionnaire.
        manager.createSession(message.guild.id, message.author.id);

        const channelMenu = new ChannelSelectMenuBuilder()
            .setCustomId("annonce_channel")
            .setPlaceholder("Choisir le salon de publication")
            .setChannelTypes([ChannelType.GuildText, ChannelType.GuildAnnouncement])
            .setMinValues(1)
            .setMaxValues(1);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("annonce_config")
                .setLabel("Configurer le contenu")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("annonce_preview")
                .setLabel("Previsualiser")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("annonce_publish")
                .setLabel("Publier")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("annonce_cancel")
                .setLabel("Annuler")
                .setStyle(ButtonStyle.Danger)
        );

        const panel = await message.reply({
            content:
                "Panneau de creation d'annonce.\n" +
                "1. Choisis le salon.\n" +
                "2. Configure le texte, l'image et le lien.\n" +
                "3. Previsualise puis publie.",
            components: [
                new ActionRowBuilder().addComponents(channelMenu),
                buttons
            ],
            allowedMentions: { parse: [] }
        });

        // Ne pas supprimer le brouillon avec un ancien timer si un nouveau panneau est cree.
        const draft = manager.getSession(message.guild.id, message.author.id);
        if (draft) draft.panelId = panel.id;

        setTimeout(async () => {
            const currentDraft = manager.getSession(message.guild.id, message.author.id);
            if (currentDraft && currentDraft.panelId === panel.id) {
                manager.deleteSession(message.guild.id, message.author.id);
                try {
                    await panel.edit({
                        content: "Ce panneau d'annonce a expire. Relance `nannonce` pour en creer un autre.",
                        components: []
                    });
                } catch (_) {}
            }
        }, 30 * 60 * 1000);

        return panel;
    }
};