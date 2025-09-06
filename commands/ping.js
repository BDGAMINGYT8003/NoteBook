const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, SectionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot and API latency.'),
    async execute(interaction) {
        // Initial reply to get a timestamp
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, flags: MessageFlags.Ephemeral });

        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        // Measure API latency
        const apiStartTime = Date.now();
        await fetch('https://api.n-sfw.com/endpoints');
        const apiLatency = Date.now() - apiStartTime;

        const pingContainer = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Bot Latency:** \`${roundtripLatency}ms\``),
                    new TextDisplayBuilder().setContent(`**API Latency:** \`${apiLatency}ms\``)
                )
            );

        await interaction.editReply({
            content: '',
            components: [pingContainer],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
