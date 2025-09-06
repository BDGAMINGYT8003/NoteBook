const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, SeparatorBuilder } = require('discord.js');

// Manually define utility commands for categorization
const UTILITY_COMMANDS = ['ping', 'invite', 'help'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all available commands.'),
    async execute(interaction) {
        const { commands } = interaction.client;

        const utilityCmds = commands
            .filter(cmd => UTILITY_COMMANDS.includes(cmd.data.name))
            .map(cmd => `</${cmd.data.name}:${cmd.id}>\n*${cmd.data.description}*`)
            .join('\n');

        const nsfwCmds = commands
            .filter(cmd => !UTILITY_COMMANDS.includes(cmd.data.name))
            .map(cmd => `</${cmd.data.name}:${cmd.id}>`)
            .join(', ');

        const helpContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2) // Discord Blurple
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('### 🤖 Bot Commands'),
                new TextDisplayBuilder().setContent('Here is a full list of commands you can use.')
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**🛠️ Utility Commands**'),
                new TextDisplayBuilder().setContent(utilityCmds || 'No utility commands found.')
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**🔞 NSFW Commands**'),
                new TextDisplayBuilder().setContent(nsfwCmds || 'No NSFW commands found.')
            );

        await interaction.reply({
            components: [helpContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
