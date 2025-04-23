module.exports = {
    // --- Propiedades del Comando ---
    name: 'skip',
    description: 'Salta la canción actual.',
    aliases: ['s', 'next'],
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

        // 2. Validar que hay una cola activa
        if (!queue) {
            return message.channel.send('❌ No hay canciones en la cola para saltar.');
        }

        // 3. Validar que el usuario está en el mismo canal de voz que el bot
        if (!message.member?.voice.channel || message.member.voice.channel.id !== message.guild.members.me?.voice.channel?.id) {
             return message.channel.send('🚫 Debes estar en el mismo canal de voz que el bot para usar este comando.');
        }

        // 4. Validar si realmente hay algo a lo que saltar
        // Si solo queda 1 canción (la actual) y el modo de repetición está desactivado (0), no se puede saltar a la siguiente.
        if (queue.songs.length <= 1 && queue.repeatMode === 0) {
             // En este caso, Distube.skip() podría lanzar un error o no hacer nada,
             // es mejor manejarlo explícitamente o indicar al usuario que no hay más canciones.
             // Distube.stop() podría ser una alternativa si el usuario quiere terminar.
             // return message.channel.send('ℹ️ No hay más canciones en la cola para saltar. Considera usar `!stop`.');

             // Alternativa: Simplemente intenta saltar y deja que Distube maneje el final de la cola.
             // Sin embargo, el mensaje de abajo es más informativo.
        }

        // 5. Usar DisTube para saltar la canción
        try {
             // Distube.skip() intenta saltar a la siguiente canción. Si no hay, dependiendo de la configuración,
             // puede terminar la cola. Pasar 'message' o 'interaction' ayuda a Distube con los permisos y respuestas.
             await client.distube.skip(message);
             message.channel.send(`⏭️ Canción saltada.`); // Mensaje de confirmación inmediato
             // Distube también disparará el evento 'playSong' para la siguiente canción

         } catch (e) {
             // Capturar errores, por ejemplo, si no hay más canciones para saltar
             if (e.message === 'No next song in queue.') {
                  message.channel.send('ℹ️ No hay más canciones en la cola para saltar.');
             } else {
                console.error('Error skipping song:', e);
                message.channel.send(`❌ Ocurrió un error al intentar saltar la canción: ${e.message}`);
             }
         }
    },
};