const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require("baileys");
const ffmpeg = require("fluent-ffmpeg");
const QRCode = require("qrcode")

async function conectarWhatsapp(){

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    // config
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    // conexion
    sock.ev.on("connection.update", async(update) => {
        const { connection, lastDisconnect, qr } = update;

        if(connection === 'close'){
            const puedeConectarse = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(puedeConectarse){
                conectarWhatsapp()
            }
        }else if(connection === 'open'){
            console.log("CONEXION ABIERTA!!!");
        }

        if(qr){
            console.log(await QRCode.toString(qr, {type: 'terminal', small: true}));
        }
    })

    // recibir Mensajes
    sock.ev.on("messages.upsert", async (event) => {

        // console.log(event.messages[0].message?.conversation);
        for (const m of event.messages) {
            const nombre = m.pushName;
            const id = m.key.remoteJid;
            const mensaje = m.message?.conversation || m.message?.extendedTextMessage?.text;

            // console.log(event.type);
            // console.log(m.key.fromMe);
            // console.log(id)
            if(event.type != 'notify' || m.key.fromMe || id.includes('@g.us') || id.includes('@broadcast')){
                return;
            }
            console.log("Nombre: "+ nombre +" . dice: "+ mensaje);

            // Leer Mensaje
            await sock.readMessages([m.key]);
            // Escribiendo...
            await delay(100);
            await sock.sendPresenceUpdate("composing", id);
            await delay(1000);
            await sock.sendPresenceUpdate("recording", id);
            await delay(1000);
            
            if(['MENU','Menu', 'Menú', 'Hola', 'hola'].includes(mensaje)){
                await sock.sendMessage(id, {text: `*Hola* 👋 Bienvenid@ a *miBOT* 🌟. Selecciona una *Opción* que te interesa:\n- 👉 *A*: Mensaje Texto📱\n- 👉 *B*: Mensaje Mención📱\n- 👉 *C*: Ubicación\n- 👉 *D*: Hablar con Asesor📱\n- 👉 *E*: Reacción\n- 👉 *H*: Links\n- 👉 *H*: Imágenes\n> *Indícanos qué opción te interesa conocer!* `});

            }else if(['A','a'].includes(mensaje)){
                await sock.sendMessage(id, {text: 'Hola este es un mensaje de texto'});
            }else if(['B','b'].includes(mensaje)){
                await sock.sendMessage(id, {text: 'Hola @'+id+' este es un mensaje tipo mención', mentions: [id]});
            }else if(['C','c'].includes(mensaje)){
                await sock.sendMessage(id, {
                    location: {
                        degreesLatitude: 24.1212331,
                        degreesLongitude: 55.112122,
                        address: 'Av. 123. Zona: ABC'
                    }});
            }else if(['D','d'].includes(mensaje)){

                const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
                    + 'VERSION:3.0\n' 
                    + 'FN:Yoshua Palacios\n' // full name
                    + 'ORG:Blimbit;\n' // the organization of the contact
                    + 'TEL;type=CELL;type=VOICE;waid=5212411641637:+521 2411641637\n' // WhatsApp ID + phone number
                    + 'END:VCARD'

                    await sock.sendMessage(
                        id,
                        { 
                            contacts: { 
                                displayName: 'Yoshua Palacios', 
                                contacts: [{ vcard }] 
                            }
                        }
                    )
            }else if(['E','e'].includes(mensaje)){
                await sock.sendMessage(
                    id,
                    {
                        react: {
                            text: '💖', // use an empty string to remove the reaction
                            key: m.key
                        }
                    }
                )
            }else if(['F','f'].includes(mensaje)){
                await sock.sendMessage(
                    id,
                    {
                        poll: {
                            name: '¿Frontend o Backend?',
                            values: ['Frontend', 'Backend', 'Fullstack'],
                            selectableCount: 1,
                            toAnnouncementGroup: false // or true
                        }
                    }
                )
            }else if(['G','g'].includes(mensaje)){
                await sock.sendMessage(id, {text: "Hola visita mi repositorio y sígueme: https://github.com/Fhorazombie"})
            }else if(['H','h'].includes(mensaje)){
                await sock.sendMessage(id, {image: { url: "https://back.blumbit.net/api/public/Copia%20de%20Laravel%20y%20Angular%20(11).png"}})
                await sock.sendMessage(id, {
                                            image: { 
                                                url: "https://back.blumbit.net/api/public/Copia%20de%20Laravel%20y%20Angular%20(11).png"
                                            },
                                            caption: 'Hola en este curso podrás aprender *FULLSTACK* con laravel y Angular. para más información escribenos...'
                                        })
                
            }else if(['I','i'].includes(mensaje)){
                await sock.sendMessage(id, {document: {url: "https://blumbit.iivot.com/uploads/1746677445229-925358781-Temario%20Angular.pdf"}, fileName: 'Temario Angular'})
                await sock.sendMessage(id, {document: {url: "https://blumbit.iivot.com/uploads/1746677445229-925358781-Temario%20Angular.pdf"}, fileName: 'Temario Angular', caption: 'Aquí encontrarás toda la información del curso Angular'})

            }else if(['J','j'].includes(mensaje)){
                await sock.sendMessage(id, {video: {url: "./Media/ma_gif.mp4"}})
                await sock.sendMessage(id, {video: {url: "./Media/ma_gif.mp4"}, caption: 'Hola este es mi video'})
                await sock.sendMessage(id, {video: {url: "./Media/ma_gif.mp4"}, ptv: true})
                await sock.sendMessage(id, {video: {url: "./Media/ma_gif.mp4"}, gifPlayback: true})


            }else if(['K','k'].includes(mensaje)){

                const mp3Path = "./Media/sonata.mp3";
                const opusPath = mp3Path.replace(/\.mp3$/, ".opus");
                await convertirMp3AOpus(mp3Path, opusPath);

                await sock.sendMessage(id, {audio: {url: "./Media/sonata.opus",}, ptt: true});

            }

            return;
        }
        
    });

}

conectarWhatsapp()

// npm install fluent-ffmpeg
function convertirMp3AOpus(inputPath, outputPath){
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec('libopus')
            .format("opus")
            .audioBitrate(64)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    })
}