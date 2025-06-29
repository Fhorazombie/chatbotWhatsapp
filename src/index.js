const { default: axios } = require("axios");
const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = require("baileys")
const QRCode = require('qrcode')
// Load environment variables from .env file
require('dotenv').config()

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
            // send the message to OpenAI
            if(mensaje){
                console.log(`Mensaje recibido de ${nombre}: ${mensaje}`);
                const respuesta = await sendToOpenAI(mensaje);
                // send the response back to WhatsApp
                await sock.sendMessage(id, { text: respuesta });
            }
        }
    });


}

connectToWhatsApp()

// a function async to send to openai a message
async function sendToOpenAI(message) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'Actua como un programador experto mexicano, responderas en menos de 25 palabras. Y no hablaras de otros temas solo de la empresa Casa Mecate' },
            { role: 'user', content: message }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    console.log(response.data.choices[0].message.content);

    return response.data.choices[0].message.content;
}