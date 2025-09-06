const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags
} = require('discord.js');

const CATEGORY = 'vagina';
const CATEGORY_NAME = 'Vagina';

module.exports = {
    data: new SlashCommandBuilder()
        .setName(CATEGORY)
        .setDescription(`Fetches a random ${CATEGORY_NAME} image.`),
    async execute(interaction) {
        // --- NSFW Channel Check ---
        if (!interaction.channel.nsfw) {
            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ **Error:** This command can only be used in a channel marked as NSFW.')
                );
            return interaction.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        try {
            // --- API Fetch ---
            const response = await fetch(`https://api.n-sfw.com/nsfw/${CATEGORY}`);
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            const data = await response.json();
            const imageUrl = data.url;

            // --- Component Builders ---
            const textHeader = new TextDisplayBuilder().setContent(`### ${CATEGORY_NAME}`);

            const imageGallery = new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(imageUrl).setDescription(`A ${CATEGORY_NAME} image.`)
            );

            const refreshButton = new ButtonBuilder()
                .setCustomId(`refresh-${CATEGORY}`)
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Primary);

            const actionRow = new ActionRowBuilder().addComponents(refreshButton);

            const mainContainer = new ContainerBuilder()
                .addTextDisplayComponents(textHeader)
                .addMediaGalleryComponents(imageGallery)
                .addActionRowComponents(actionRow);

            await interaction.editReply({
                components: [mainContainer],
                flags: MessageFlags.IsComponentsV2,
            });

        } catch (error) {
            console.error(`Error fetching for ${CATEGORY}:`, error);
            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`❌ **Error:** Could not fetch an image from the API for the **${CATEGORY_NAME}** category. Please try again.`)
                );
            await interaction.editReply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2,
            });
        }
    },
};
