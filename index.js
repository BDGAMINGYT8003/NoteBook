const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    Events,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require('discord.js');
const { token, clientId } = require('./config.json');

// --- Client Setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// --- Dynamic Command Loading ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// --- Global Command Registration ---
const rest = new REST({ version: '10' }).setToken(token);

async function deployCommands() {
    try {
        const commands = Array.from(client.commands.values()).map(c => c.data.toJSON());
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}

// --- Event Handlers ---

// Ready Event: Runs once when the bot is logged in and ready.
client.once(Events.ClientReady, async readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    await deployCommands();
});

// InteractionCreate Event: Handles all interactions (slash commands, buttons, etc.)
client.on(Events.InteractionCreate, async interaction => {
    // --- Slash Command Handler ---
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ **Error:** An unexpected error occurred while executing this command. Please try again later.')
                );
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            }
        }
        return;
    }

    // --- Button Interaction Handler (for Refresh) ---
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('refresh-')) {
            const category = interaction.customId.split('-')[1];
            if (!category) return;

            try {
                await interaction.deferUpdate();

                const response = await fetch(`https://api.n-sfw.com/nsfw/${category}`);
                if (!response.ok) {
                    console.error(`API Error for category ${category}: ${response.status} ${response.statusText}`);
                     throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();
                const imageUrl = data.url;

                const newGallery = new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder().setURL(imageUrl).setDescription(`A ${category} image.`)
                );

                const textHeader = new TextDisplayBuilder().setContent(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
                const refreshButton = new ButtonBuilder()
                    .setCustomId(`refresh-${category}`)
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Primary);
                const actionRow = new ActionRowBuilder().addComponents(refreshButton);

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(textHeader)
                    .addMediaGalleryComponents(newGallery)
                    .addActionRowComponents(actionRow);

                await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

            } catch (error) {
                console.error('Refresh button error:', error);
                // We cannot send an ephemeral message here as the original message is public.
                // We'll try to edit the original message to show an error.
                const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('❌ **Error:** Could not fetch a new image. Please try again.')
                    );
                try {
                    await interaction.editReply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
                } catch (editError) {
                    console.error('Failed to edit reply with error message:', editError);
                }
            }
        }
    }
});

// --- Bot Login ---
client.login(token);
