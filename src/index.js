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

}

conectarWhatsapp()