module.exports = async function runCasinoCommand(interaction, command, args) {
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate();
    }

    const sourceMessage = interaction.message;
    const adapter = {
        author: interaction.user,
        member: interaction.member || { displayName: interaction.user.username },
        guild: interaction.guild,
        channel: interaction.channel,
        reply(payload) {
            const normalized = typeof payload === "string"
                ? { content: payload, embeds: [], components: [], files: [] }
                : {
                    ...payload,
                    embeds: payload.embeds || [],
                    components: payload.components || [],
                    files: payload.files || []
                };

            return sourceMessage.edit(normalized);
        }
    };

    try {
        return await command.execute(adapter, args);
    } catch (error) {
        console.error("Erreur pendant une partie du casino :", error);
        return sourceMessage.edit({
            content: "❌ Une erreur est survenue pendant la partie.",
            embeds: [],
            components: [],
            files: []
        });
    }
};
