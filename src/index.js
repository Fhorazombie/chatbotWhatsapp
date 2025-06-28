const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require("baileys");
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

        console.log(event.messages[0].message.conversation);
        for (const m of event.messages) {
            const nombre = m.pushName;
            const id = m.key.remoteJid;
            const mensaje = m.message.conversation != null ? m.message.conversation : m.message?.extendedTextMessage?.text

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
                await sock.sendMessage(id, {text: `*Hola* 👋 Bienvenid@ a *miBOT* 🌟. Selecciona una *Opción* que te interesa:\n- 👉 *A*: Mensaje Texto📱\n- 👉 *B*: Mensaje Mención📱\n- 👉 *C*: Ubicación\n- 👉 *D*: Hablar con Asesor📱\n- 👉 *E*: Reacción\n> *Indícanos qué opción te interesa conocer!* `});

            }else if(['A','a'].includes(mensaje)){
                await sock.sendMessage(id, {text: 'Hola este es un mensaje de texto'});
            }else if(['B','b'].includes(mensaje)){
                await sock.sendMessage(id, {text: 'Hola @59173277937 este es un mensaje tipo mención', mentions: ['59173277937@s.whatsapp.net']});
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
                    + 'FN:Cristian\n' // full name
                    + 'ORG:Blimbit;\n' // the organization of the contact
                    + 'TEL;type=CELL;type=VOICE;waid=59173277937:+591 73277937\n' // WhatsApp ID + phone number
                    + 'END:VCARD'

                    await sock.sendMessage(
                        id,
                        { 
                            contacts: { 
                                displayName: 'Cristian', 
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
            }

            return;
        }
        
    });

}

conectarWhatsapp()