const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { clientId } = require('../config.json');

// Permissions integer for: Send Messages, Use Application Commands, Embed Links
const PERMISSIONS = '2147502080';
const INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${PERMISSIONS}&scope=bot%20applications.commands`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link for the bot.'),
    async execute(interaction) {
        const inviteContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("Click the button below to invite me to your server!")
            )
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Me')
                        .setStyle(ButtonStyle.Link)
                        .setURL(INVITE_URL)
                )
            );

        await interaction.reply({
            components: [inviteContainer],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
