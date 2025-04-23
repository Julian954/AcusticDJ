// Cargar variables de entorno del archivo .env
require('dotenv').config();

// Importar clases necesarias de discord.js y módulos de Node.js para manejo de archivos
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs'); // Módulo para interactuar con el sistema de archivos
const path = require('node:path'); // Módulo para manejar rutas de archivos

// Importar DisTube y los plugins para Spotify y SoundCloud
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');

// Crear una nueva instancia del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Crear una colección para almacenar los comandos
// Usaremos esta colección para encontrar y ejecutar comandos rápidamente
client.commands = new Collection();

// --- Lógica para cargar comandos desde archivos ---

// Definir la ruta a la carpeta de comandos
const commandsPath = path.join(__dirname, 'commands');
// Leer los nombres de todas las subcarpetas dentro de 'commands' (ej: 'music', 'general')
const commandFolders = fs.readdirSync(commandsPath);

// Recorrer cada carpeta de comandos
for (const folder of commandFolders) {
    // Construir la ruta a la carpeta actual
    const folderPath = path.join(commandsPath, folder);
    // Leer los nombres de todos los archivos .js dentro de la carpeta actual
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    // Recorrer cada archivo de comando
    for (const file of commandFiles) {
        // Construir la ruta completa al archivo de comando
        const filePath = path.join(folderPath, file);
        // Requerir el módulo del comando
        const command = require(filePath);

        // Verificar si el módulo exporta las propiedades necesarias (name y execute)
        if ('name' in command && 'execute' in command) {
            // Si todo es correcto, añadir el comando a la colección
            client.commands.set(command.name, command);
             console.log(`Comando cargado: ${command.name} desde ${folder}/${file}`);
        } else {
            // Advertir si un archivo de comando no tiene las propiedades requeridas
            console.warn(`[ADVERTENCIA] El comando en ${filePath} le faltan las propiedades "name" o "execute".`);
        }
    }
}
// --- Fin de la lógica de carga de comandos ---


// Inicializar DisTube (esto se queda igual)
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: false,
    emitAddSongWhenCreatingQueue: false,
    plugins: [new SpotifyPlugin(), new SoundCloudPlugin()],
    // leaveOnStop: true,
    // leaveOnEmpty: true,
});

// Manejador de eventos de DisTube (esto se queda igual por ahora)
client.distube
    .on('playSong', (queue, song) => {
         // Este evento lo modificaremos en el Paso 7 para usar embeds/botones
         // Por ahora, puedes dejar un mensaje simple o el embed anterior si ya lo tenías
        queue.textChannel.send(`▶️ Reproduciendo: **${song.name}** - \`${song.formattedDuration}\` | Solicitada por: ${song.user}`);
    })
    .on('addSong', (queue, song) => {
        queue.textChannel.send(
            `✅ Añadida ${song.name} - \`${song.formattedDuration}\` a la cola por ${song.user}`
        );
    })
    .on('addList', (queue, playlist) => {
        queue.textChannel.send(
            `✅ Añadida la lista de reproducción \`${playlist.name}\` (${playlist.songs.length} canciones) a la cola por ${playlist.user}`
        );
    })
    .on('error', (channel, e) => {
        if (channel) channel.send(`❌ Error: ${e.toString().slice(0, 1974)}`);
        else console.error(e);
    })
    .on('disconnect', queue => {
        queue.textChannel.send('❌ Desconectado del canal de voz.');
    })
    .on('empty', queue => {
        queue.textChannel.send('Canal de voz vacío, saliendo...');
    })
    .on('finish', queue => {
        queue.textChannel.send('No more songs in queue.');
    });


// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
});

// Prefijo para los comandos
const prefix = '!';

// Manejador de mensajes para encontrar y ejecutar comandos
client.on('messageCreate', async message => {
    // Ignorar mensajes de bots y mensajes que no empiezan con el prefijo o que no están en un servidor
    if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) {
        return;
    }

    // Extraer comando y argumentos
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Buscar el comando en la colección
    // También puedes buscar por alias si los implementas en tus archivos de comando
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); // Ejemplo de búsqueda por alias

    // Si no se encontró el comando, simplemente salir
    if (!command) return;

    // --- Ejecutar el comando encontrado ---
    try {
        // Pasamos el objeto message, los argumentos y el cliente (para acceder a distube) a la función execute del comando
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        // Enviar un mensaje de error al canal si algo falla durante la ejecución del comando
        message.reply({ content: 'Hubo un error al intentar ejecutar ese comando!', ephemeral: true }); // ephemeral: true solo funciona en interacciones
        // Para mensajes normales, usa:
        // message.channel.send('Hubo un error al intentar ejecutar ese comando!');
    }
});


// --- Manejador de Interacciones (para botones) ---
// Este manejador se queda en index.js ya que centraliza la lógica de botones
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); // Importar si no estaban ya

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const queue = client.distube.getQueue(interaction.guild.id);

    if (!queue) {
        return interaction.reply({ content: 'No hay música reproduciéndose en este momento.', ephemeral: true });
    }

     if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel?.id) {
         return interaction.reply({ content: 'Debes estar en el mismo canal de voz que el bot para controlar la música.', ephemeral: true });
    }

    switch (interaction.customId) {
        case 'pauseResume':
            if (queue.paused) {
                queue.resume();
                interaction.reply({ content: '▶️ Música reanudada.', ephemeral: true });
            } else {
                queue.pause();
                interaction.reply({ content: '⏸️ Música pausada.', ephemeral: true });
            }
            break;
        case 'skip':
             if (queue.songs.length > 1 || queue.repeatMode !== 0) {
                 try {
                     client.distube.skip(interaction);
                     interaction.reply({ content: '⏭️ Canción saltada.', ephemeral: true });
                 } catch (e) {
                     interaction.reply({ content: `❌ Error al saltar: ${e}`, ephemeral: true });
                 }
            } else {
                 try {
                     client.distube.stop(interaction);
                     interaction.reply({ content: '⏹️ No hay más canciones, deteniendo la reproducción.', ephemeral: true });
                 } catch (e) {
                     interaction.reply({ content: `❌ Error al detener: ${e}`, ephemeral: true });
                 }
            }
            break;
        case 'stop':
             try {
                client.distube.stop(interaction);
                interaction.reply({ content: '⏹️ Reproducción detenida y cola limpiada.', ephemeral: true });
             } catch (e) {
                 interaction.reply({ content: `❌ Error al detener: ${e}`, ephemeral: true });
             }
            break;
    }
});

// Modificar el evento 'playSong' de DisTube para usar el Embed y Botones (mover esto aquí si quieres que esté en index.js)
client.distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎶 Ahora Reproduciendo')
        .setDescription(`[${song.name}](${song.url})`)
        .setThumbnail(song.thumbnail)
        .addFields(
            { name: 'Duración', value: `\`${song.formattedDuration}\``, inline: true },
            { name: 'Solicitada por', value: `${song.user}`, inline: true }
        )
        .setFooter({ text: `Servidor: ${queue.guild.name}` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('pauseResume')
                .setLabel('⏸️ / ▶️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('⏭️ Saltar')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('⏹️ Detener')
                .setStyle(ButtonStyle.Danger),
        );

    queue.textChannel.send({ embeds: [embed], components: [row] });
});


// Iniciar sesión con el token del bot
client.login(process.env.DISCORD_TOKEN);