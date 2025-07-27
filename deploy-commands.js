const { token, clientId, guildId } = require('./config.json');
const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const playersCount = 20; // Reduced to stay under Discord's 25 option limit
const startCommand = 
    new SlashCommandBuilder()
        .setName('start')
        .setDescription('Creates a new game of Hunger Games.')
        .addBooleanOption(option =>
            option
                .setName('all_members')
                .setDescription('Include all server members in the game (excludes bots)')
                .setRequired(false)
        );

        for (let i = 1; i <= playersCount; i++) {
            startCommand.addStringOption(option =>
                option
                    .setName(`player${i}_name`)
                    .setDescription(`Enter the name of Player ${i} (ignored if all_members is true).`)
                    .setRequired(i === 1 && false) // Make none required when we have all_members option
            );
        };
const nextCommand =
    new SlashCommandBuilder()
        .setName('next')
        .setDescription('takes to next day')
const stopCommand = 
    new SlashCommandBuilder()
        .setName('quit')
        .setDescription('terminates program')
const playerCommand =
        new SlashCommandBuilder()
            .setName('status')
            .setDescription('See the achievements and status of a player')
            .addStringOption(option =>
                option
                    .setName('player_name')
                    .setDescription('Player Name (must be exact)')
                    .setRequired(true)
            )

const eventsCommand =
        new SlashCommandBuilder()
            .setName('events')
            .setDescription('See all events that happened to a specific player')
            .addStringOption(option =>
                option
                    .setName('player_name')
                    .setDescription('Player Name (must be exact)')
                    .setRequired(true)
            )

const commands = [playerCommand, eventsCommand, startCommand, nextCommand, stopCommand].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
