const { EmbedBuilder } = require('discord.js'); // Importar EmbedBuilder para crear un mensaje más agradable

module.exports = {
    // --- Propiedades del Comando ---
    name: 'queue',
    description: 'Muestra la cola de reproducción actual (las siguientes 10 canciones).',
    aliases: ['q', 'cola', 'lista'],
    usage: '',
    guildOnly: true,

    // --- Función de Ejecución del Comando ---
    /**
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     * @param {import('discord.js').Client} client
     */
    async execute(message, args, client) {
        // 1. Obtener la cola de DisTube para este servidor
        const queue = client.distube.getQueue(message.guild.id);

        // 2. Validar que hay una cola activa y con canciones
        if (!queue || queue.songs.length === 0) {
            return message.channel.send('🎶 La cola está vacía.');
        }

        // 3. Construir la cadena de la cola para mostrar en el mensaje
        // Mostraremos la canción actual (índice 0) y las siguientes
        // Limitamos la cantidad de canciones mostradas para no exceder el límite de caracteres de Discord

        const limit = 10; // Número máximo de canciones a mostrar (incluyendo la actual)
        const songs = queue.songs.slice(0, limit); // Tomar solo las primeras 'limit' canciones

        const queueString = songs.map((song, i) =>
            // Formato: 1. Nombre de la Canción - [Duración]
            `${i === 0 ? '**Reproduciendo Ahora:**' : `${i}.`} ${song.name} - \`${song.formattedDuration}\``
        ).join('\n'); // Unir todas las líneas con saltos de línea

        // 4. Crear un Embed para mostrar la cola de forma más agradable
        const queueEmbed = new EmbedBuilder()
            .setColor('#0099ff') // Un color distintivo
            .setTitle('🎵 Cola de Música')
            .setDescription(queueString) // El contenido principal es la lista de canciones
            // Añadir un pie de página si hay más canciones de las que se muestran
            .setFooter({ text: queue.songs.length > limit ? `... y ${queue.songs.length - limit} canción(es) más.` : 'Fin de la cola.' })
            .setTimestamp(); // Marca de tiempo

        // 5. Enviar el mensaje con el Embed
        message.channel.send({ embeds: [queueEmbed] });

        // Opcional: borrar el mensaje del comando si lo deseas
        // message.delete().catch(err => console.error('Error deleting message:', err));
    },
};