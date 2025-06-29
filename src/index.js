const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = require("baileys")
const QRCode = require('qrcode')

const userContext = {}

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
        console.log(userContext)

        for (const m of event.messages) {
            const id = m.key.remoteJid;

            if(event.type != 'notify' || m.key.fromMe || id.includes('@g.us') || id.includes('@broadcast')){
                return;
            }
            const nombre = m.pushName;
            let mensaje = m.message?.conversation || m.message?.extendedTextMessage?.text;
            mensaje = mensaje+"".toUpperCase();
            
            
            if(!userContext[id]){
                userContext[id] = { menuActual: "main" };
                enviarMenu(sock, id, "main");
                return;
            }
// 59176501385
            

            const menuActual = userContext[id].menuActual;
            const menu = menuData[menuActual];

            const opcionSelecionada = menu.options[mensaje]

            if(opcionSelecionada){
                if(opcionSelecionada.respuesta){
                    const tipo = opcionSelecionada.respuesta.tipo;
                    if(tipo == "text"){
                        await sock.sendMessage(id, {text: opcionSelecionada.respuesta.msg})
                    }
                    if(tipo == "image"){
                        await sock.sendMessage(id, {image: opcionSelecionada.respuesta.msg})
                    }
                    if(tipo == "document"){
                        await sock.sendMessage(id, {document: opcionSelecionada.respuesta.msg})
                    }
                    if(tipo == "location"){
                        await sock.sendMessage(id, {location: opcionSelecionada.respuesta.msg})
                    }
                    if(tipo == "contact"){
                        await sock.sendMessage(id, {contacts: opcionSelecionada.respuesta.msg})
                    }
                }
                if(opcionSelecionada.submenu){
                    userContext[id].menuActual = opcionSelecionada.submenu;
                    enviarMenu(sock, id, opcionSelecionada.submenu);
                }
                
            }else{
                // await sock.sendMessage(id, {text: "Por favor, elige una opción del menú"})

            }

            // await sock.sendMessage(id, {text: "Hola Mundo... desde bot"})
        }
    });


}

connectToWhatsApp();

async function enviarMenu(sock, id, menuKey){
    const menu = menuData[menuKey];

    const optionText = Object.entries(menu.options)
                                .map(([key, option]) => `- 👉 *${key}*: ${option.text}`)
                                .join("\n");
    
    const menuMensaje = `${menu.mensaje}\n\n${optionText}\n\n> *Escribe una opción!*`;

    await sock.sendMessage(id, {text: menuMensaje});
}

// menu

const menuData = {
    main: {
        mensaje: "*¡Bienvenid@ a [Nombre de la Clínica Dental]* 🦷. Selecciona una *opción* (ej. A, B, C)",
        options: {
            A: {
                text: "Servicios Dentales 🦷",
                submenu: "servicios"
            },
            B: {
                text: "Ver Horarios y Ubicación 📍",
                submenu: "ubicacion"
            },
            C: {
                text: "Agenda una Cita 📅",
                respuesta: {
                    tipo: "text",
                    msg: "Para agendar tu cita, por favor elige una opción: 1) Agendar en línea 2) Llamar a la clínica."
                }
            },
            D: {
                text: "Preguntas Frecuentes ❓",
                submenu: "faq"
            },
            E: {
                text: "Contáctanos 📞",
                respuesta: {
                    tipo: "text",
                    msg: "Puedes llamarnos al número: +123 456 7890 o enviarnos un correo a: contacto@clinicadental.com"
                }
            },
        }
    },
    servicios: {
        mensaje: "Estos son los *servicios* dentales que ofrecemos:",
        options: {
            1: {
                text: "Chequeo General 🦷",
                respuesta: {
                    tipo: "text",
                    msg: "El chequeo general incluye una revisión completa de tu salud dental, limpieza y recomendaciones personalizadas."
                }
            },
            2: {
                text: "Blanqueamiento Dental ✨",
                respuesta: {
                    tipo: "text",
                    msg: "Nuestro tratamiento de blanqueamiento dental te ayudará a obtener una sonrisa más brillante y saludable."
                }
            },
            3: {
                text: "Ortodoncia (Brackets) 😁",
                respuesta: {
                    tipo: "text",
                    msg: "La ortodoncia es el tratamiento ideal para alinear y corregir los dientes y la mordida. Contamos con opciones invisibles."
                }
            },
            4: {
                text: "Implantes Dentales 🦷",
                respuesta: {
                    tipo: "text",
                    msg: "Los implantes dentales son una excelente opción para reemplazar dientes perdidos de manera duradera y estética."
                }
            },
            5: {
                text: "Volver al menú principal",
                submenu: "main"
            },
        }
    },
    faq: {
        mensaje: "Estas son algunas de las preguntas frecuentes que recibimos:",
        options: {
            1: {
                text: "¿Cada cuánto debo ir al dentista?",
                respuesta: {
                    tipo: "text",
                    msg: "Es recomendable acudir al dentista al menos una vez al año para un chequeo general y una limpieza dental."
                }
            },
            2: {
                text: "¿Los tratamientos son dolorosos?",
                respuesta: {
                    tipo: "text",
                    msg: "La mayoría de nuestros tratamientos son rápidos y con mínima incomodidad. Nuestro equipo se asegura de que te sientas cómodo durante todo el proceso."
                }
            },
            3: {
                text: "¿Qué hacer si tengo dolor de muelas?",
                respuesta: {
                    tipo: "text",
                    msg: "Si experimentas dolor de muelas, es importante que agendes una cita lo antes posible para evitar complicaciones."
                }
            },
            4: {
                text: "¿Aceptan seguros dentales?",
                respuesta: {
                    tipo: "text",
                    msg: "Sí, trabajamos con varios seguros dentales. Por favor, consulta con nuestro equipo para más detalles."
                }
            },
            5: {
                text: "Volver al menú principal",
                submenu: "main"
            },
        }
    },
    ubicacion: {
        mensaje: "Estamos ubicados en: *Dirección de la Clínica Dental* 📍",
        options: {
            1: {
                text: "Ver mapa",
                respuesta: {
                    tipo: "location",
                    msg: {
                        degreesLatitude: 19.432608,
                        degreesLongitude: -99.133209,
                        address: "Calle Ficticia 123, Ciudad, País"
                    }
                }
            },
            2: {
                text: "Ver horarios de apertura",
                respuesta: {
                    tipo: "text",
                    msg: "Nuestro horario es de Lunes a Viernes de 8:00 AM a 6:00 PM y Sábados de 9:00 AM a 2:00 PM."
                }
            },
            3: {
                text: "Volver al menú principal",
                submenu: "main"
            },
        }
    }
}


/*
const menuData = {
    main: {
        mensaje: "*Hola* 👋 Bienvenid@ a *miBot* 🌟. Selecciona una *opción* (ej. A,B)",
        options: {
            A: {
                text: "Métodos de Pago",
                respuesta: {
                    tipo: "text",
                    msg: "Los métodos de pago son: ..."
                }
            },
            B: {
                text: "Ver catalogo",
                respuesta: {
                    tipo: "image",
                    msg: {
                        url: "https://back.blumbit.net/api/public/Copia%20de%20Laravel%20y%20Angular%20(11).png"
                    }
                }
            },
            C: {
                text: "Nuestros Servicios📱",
                submenu: "servicios"
            },
            D: {
                text: "Nuestra Ubicación",
                respuesta: {
                    tipo: "location",
                    msg: {
                        degreesLatitude: 24.1212331,
                        degreesLongitude: 55.112122,
                        address: 'Av. 123. Zona: ABC'
                    }
                }
            },
        }
    },
    servicios: {
        mensaje: "Nuestros *Servicios* que ofrecemos son:",
        options: {
            1: {
                text: "Desarrollo de Software",
                respuesta: {
                    tipo: "text",
                    msg: "Desarrollamos software a medida ..."
                }
            },
            2: {
                text: "Nuestros Clientes",
                respuesta: {
                    tipo: "document",
                    msg: {
                        url: "https://blumbit.iivot.com/uploads/1746677445229-925358781-Temario%20Angular.pdf"
                    }
                }
            },
            3: {
                text: "Volver al menú",
               submenu: "main"
            },

        }
    }
}
*/
/*
*Hola* 👋 Bienvenid@ a *miBot* 🌟. Selecciona el *Curso* que te interesa y te enviaremos la información correspondiente:

- 👉 *A*: Métodos de Pago
- 👉 *B*: Ver catalogo
- 👉 *C*: Nuestros Servicios📱
- 👉 *D*: Nuestra Ubicación

> *Indícanos qué opción te interesa conocer!* 
*/
