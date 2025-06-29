const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = require("baileys")
const QRCode = require('qrcode');
const Contacto = require("./models/Contacto.js")

async function connectToWhatsApp () {

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        // can provide additional config here
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const {connection, lastDisconnect, qr } = update
        // on a qr event, the connection and lastDisconnect fields will be empty
      
        if(connection === 'close'){
            const puedeConectarse = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(puedeConectarse){
                connectToWhatsApp()
            }
        }else if(connection === 'open'){
            console.log("CONEXION ABIERTA!!!");
        }

        // In prod, send this string to your frontend then generate the QR there
        if (qr) {
          // as an example, this prints the qr code to the terminal
          console.log(await QRCode.toString(qr, {type:'terminal', small: true}))
        }
      });


       // recibir Mensajes
    sock.ev.on("messages.upsert", async (event) => {

        for (const m of event.messages) {
            const id = m.key.remoteJid;

            if(event.type != 'notify' || m.key.fromMe || id.includes('@g.us') || id.includes('@broadcast')){
                return;
            }
            const nombre = m.pushName;
            const mensaje = m.message?.conversation || m.message?.extendedTextMessage?.text;

            let contacto = await Contacto.findOne({where: {nro_whatsapp: id}})
            if(!contacto){
                contacto = await Contacto.create({
                    nro_whatsapp: id,
                    nombre: nombre
                });
            }
            if(contacto.saldo > 0){

                await sock.sendMessage(id, {text: "Hola "+contacto.nombre+" Tienes una deuda pendiente de: "+contacto.saldo});

            }else{
                await sock.sendMessage(id, {text: "Hola "+contacto.nombre+" No tienes saldos pendientes."});
            }

        }
    });


}

connectToWhatsApp()



// -----------------------------------------------

