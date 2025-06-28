const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("baileys");
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
        for (const m of event.messages) {
            const nombre = m.pushName;
            const id = m.key.remoteJid;
            const mensaje = m.message.conversation;

            // console.log(event.type);
            // console.log(m.key.fromMe);
            // console.log(id)
            if(event.type != 'notify' || m.key.fromMe || id.includes('@g.us') || id.includes('@broadcast')){
                return;
            }
            console.log("Nombre: "+ nombre +" . dice: "+ mensaje);
            await sock.sendMessage(id, {text: "Hola soy un BOT "});


        }
        
    });

}

conectarWhatsapp()