//const { TextChannel } = require("discord.js");

const { GuildChannel } = require("discord.js");

module.exports ={
    name: 'play', //Nombre del comando
    desripcion: 'Reprodeuce a song from Spotify, Youtube, Soundcloud, etc',
    aliases: ['p','P'], //Alias del comando
    usage: '<song name or URL>', //Uso del comando
    guildOnlyne:true, //Solo se puede usar en servidores
    
    //Funcion que se ejecuta al llamar el comando
    async execute(message, args, client){
        const query = args.join(' ');
        //validar que contenga algo el argumento
        if (!query) return message.channel.send('❌ Please, provide a song name.');
        //valida que el usario este en un canal de voz
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) return message.channel.send('🚫 You need to be in a voice channel to play music!');

        try{
            //inicializa el cliente de distube(canal de voz,cancion,opciones)
            await client.distube.play(voiceChannel, query, {TextChannel: message.channel, message: message,});

        }catch (error) {
            console.error(error);
            // Enviar un mensaje de error al canal si algo falla durante la ejecución del comando
            message.channel.send('❌ Error: ' + error.message); // ephemeral: true solo funciona en interacciones
        }

        //elimina el mensaje de la cola de mensajesa
        message.delete();
    }
}