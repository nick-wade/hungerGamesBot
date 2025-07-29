const { EmbedBuilder } = require('discord.js');

function createCommandHandlers(players, main) {
    async function handleStartCommand(interaction) {
        const allMembers = interaction.options.getBoolean('all_members');
        
        if (allMembers) {
            // Respond immediately to avoid timeout
            await interaction.reply({content: 'Fetching all server members and creating the game...'});
            
            // Get all members from the guild (server)
            try {
                const guild = interaction.guild;
                await guild.members.fetch(); // Fetch all members
                
                // Clear existing players
                Object.keys(players).forEach(key => delete players[key]);
                
                guild.members.cache.forEach(member => {
                    // Skip bots and add human members
                    if (!member.user.bot) {
                        // Use display name if available, otherwise use username
                        const playerName = member.displayName || member.user.username;
                        players[playerName] = { 
                            name: playerName, 
                            items: [], 
                            status: [], 
                            kills: [], 
                            allies: [], 
                            activity: null,
                            eventHistory: [] // Track events that happen to this player
                        };
                    }
                });
                
                const memberCount = Object.keys(players).length;
                if (memberCount < 2) {
                    await interaction.followUp({content: 'Not enough server members found for a game. Need at least 2 players.'});
                    return;
                }
                
                await interaction.followUp({content: `Successfully created game with ${memberCount} server members! Starting the game...`});
                main(interaction.channel.id);
                
            } catch (error) {
                console.error('Error fetching guild members:', error);
                await interaction.followUp({content: 'Error fetching server members. Please try again or use manual player selection.'});
                return;
            }
        } else {
            // Original manual player selection
            const playerNames = interaction.options._hoistedOptions.filter(option => option.name.startsWith('player') && option.value);
            
            if (playerNames.length === 0) {
                await interaction.reply({content: 'Please provide at least one player name or use the `all_members` option to include all server members.', ephemeral: true});
                return;
            }
            
            // Clear existing players
            Object.keys(players).forEach(key => delete players[key]);
            
            playerNames.forEach(playerName => {
                players[playerName.value] = { name: playerName.value, items: [], status: [], kills: [], allies: [], activity: null, eventHistory: [] };
            });
            await interaction.reply({content: `Creating game with ${playerNames.length} players...`});
            main(interaction.channel.id);
        }
    }

    async function handleNextCommand(interaction) {
        main(interaction.channel.id);
        return interaction.reply({ content: 'Proceeding...'});
    }

    async function handleStatusCommand(interaction) {
        const playerName = interaction.options._hoistedOptions[0].value;
        if (playerName in players){
            const player = players[playerName];
            const status = player.status.length > 0 ? player.status.join(', ') : 'Healthy';
            const items = player.items.length > 0 ? player.items.join(', ') : 'No items.';
            const allies = player.allies.length > 0 ? player.allies.join(', ') : 'No allies.';
            const kills = player.kills.length > 0 ? player.kills.join(', ') : 'No kills.';
            
            // Get recent events (last 5)
            const recentEvents = player.eventHistory.slice(-5).reverse();
            const eventsText = recentEvents.length > 0 ? 
                recentEvents.map(e => `**${e.time}:** ${e.event.replace(/\*\*/g, '')}`).join('\n') : 
                'No recent events.';
            
            const embed = new EmbedBuilder()
                .setTitle(`Status of ${playerName}`)
                .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                .addFields(
                    { name: 'Status', value: status, inline: true },
                    { name: 'Items', value: items, inline: true },
                    { name: 'Allies', value: allies, inline: true },
                    { name: 'Kills', value: kills, inline: true },
                    { name: 'Recent Events', value: eventsText.length > 1024 ? eventsText.substring(0, 1021) + '...' : eventsText, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Use /next to proceed to the next day.' });
            
            return interaction.reply({ embeds: [embed] });
        }
        else{
            return interaction.reply({ content: `Player not found.` });
        }
    }

    async function handleEventsCommand(interaction) {
        const playerName = interaction.options._hoistedOptions[0].value;
        if (playerName in players){
            const player = players[playerName];
            
            if (player.eventHistory.length === 0) {
                return interaction.reply({ content: `No events found for ${playerName}.`, ephemeral: true });
            }
            
            // Get all events in reverse chronological order (most recent first)
            const allEvents = player.eventHistory.slice().reverse();
            const eventsText = allEvents.map(e => `**${e.time}:** ${e.event.replace(/\*\*/g, '')}`).join('\n\n');
            
            // Split into multiple embeds if too long
            const maxLength = 4000;
            if (eventsText.length <= maxLength) {
                const embed = new EmbedBuilder()
                    .setTitle(`All Events for ${playerName}`)
                    .setDescription(eventsText)
                    .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                    .setTimestamp()
                    .setFooter({ text: `Total events: ${allEvents.length}` });
                
                return interaction.reply({ embeds: [embed] });
            } else {
                // Split into chunks  
                const chunks = [];
                let currentChunk = '';
                
                for (const event of allEvents) {
                    const eventText = `**${event.time}:** ${event.event.replace(/\*\*/g, '')}\n\n`;
                    if ((currentChunk + eventText).length > maxLength) {
                        chunks.push(currentChunk);
                        currentChunk = eventText;
                    } else {
                        currentChunk += eventText;
                    }
                }
                if (currentChunk) chunks.push(currentChunk);
                
                const embeds = chunks.map((chunk, index) => 
                    new EmbedBuilder()
                        .setTitle(index === 0 ? `All Events for ${playerName}` : `Events for ${playerName} (continued)`)
                        .setDescription(chunk)
                        .setColor(player.status.includes('deceased') ? 0xFF0000 : 0x00AE86)
                        .setFooter({ text: `Page ${index + 1}/${chunks.length} | Total events: ${allEvents.length}` })
                );
                
                return interaction.reply({ embeds: embeds.slice(0, 10) }); // Discord limit of 10 embeds
            }
        }
        else{
            return interaction.reply({ content: `Player not found.` });
        }
    }

    return {
        handleStartCommand,
        handleNextCommand,
        handleStatusCommand,
        handleEventsCommand
    };
}

module.exports = { createCommandHandlers };
