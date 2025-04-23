// No se necesitan imports adicionales

module.exports = {
    // --- Propiedades del Comando ---
    name: 'stop',
    description: 'Detiene la reproducción actual y limpia la cola.',
    aliases: ['st', 'parar'],
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
            return message.channel.send('❌ No hay nada reproduciéndose para detener.');
        }

         // 3. Validar que el usuario está en el mismo canal de voz que el bot
         if (!message.member?.voice.channel || message.member.voice.channel.id !== message.guild.members.me?.voice.channel?.id) {
             return message.channel.send('🚫 Debes estar en el mismo canal de voz que el bot para usar este comando.');
        }

        // 4. Usar DisTube para detener la reproducción y destruir la cola
        try {
             // DisTube.stop() detiene la reproducción, vacía la cola y sale del canal si leaveOnStop es true
             await client.distube.stop(message); // Pasar 'message'
             message.channel.send('⏹️ Reproducción detenida y cola limpiada.');

         } catch (e) {
             console.error('Error stopping playback:', e);
             message.channel.send(`❌ Ocurrió un error al intentar detener la reproducción: ${e.message}`);
         }
    },
};