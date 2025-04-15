const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Listar todos los puertos disponibles
async function listarPuertos() {
    const puertos = await SerialPort.list();
    console.log('Puertos disponibles:');
    puertos.forEach(puerto => {
        console.log(`${puerto.path} - ${puerto.manufacturer || 'Fabricante desconocido'}`);
    });
    return puertos;
}

// Configurar y abrir conexión con el puerto
function conectarPuerto(rutaPuerto, velocidad = 9600) {
    // Crea una nueva instancia del puerto serial
    const puerto = new SerialPort({
        path: rutaPuerto,        // Ruta al puerto (ej: COM3 en Windows, /dev/ttyUSB0 en Linux)
        baudRate: velocidad,     // Velocidad en baudios (común: 9600, 115200)
        dataBits: 8,             // Bits de datos (típicamente 8)
        stopBits: 1,             // Bits de parada (típicamente 1)
        parity: 'none',          // Paridad (none, even, odd)
        autoOpen: false          // No abrir automáticamente
    });

    // Parser para leer líneas completas
    const parser = puerto.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // Manejadores de eventos
    puerto.on('open', () => {
        console.log(`Puerto ${rutaPuerto} abierto a ${velocidad} baudios`);
    });

    puerto.on('error', (err) => {
        console.error('Error en el puerto serial:', err.message);
    });

    // Escuchar datos recibidos
    parser.on('data', (datos) => {
        console.log('Datos recibidos:', datos);
        // Aquí puedes procesar los datos recibidos
    });

    // Abrir el puerto
    puerto.open((err) => {
        if (err) {
            console.error('Error al abrir el puerto:', err.message);
        }
    });

    return { puerto, parser };
}

// Enviar datos al dispositivo RS232
function enviarDatos(puerto, datos) {
    return new Promise((resolve, reject) => {
        puerto.write(datos, (err) => {
            if (err) {
                console.error('Error al enviar datos:', err.message);
                return reject(err);
            }
            puerto.drain(resolve);
        });
    });
}

// Cerrar la conexión
function cerrarPuerto(puerto) {
    return new Promise((resolve) => {
        puerto.close(() => {
            console.log('Conexión cerrada');
            resolve();
        });
    });
}

// Ejemplo de uso
async function ejemploCompleto() {
    try {
        // Listar puertos disponibles
        const puertos = await listarPuertos();
        if (puertos.length === 0) {
            console.log('No se encontraron puertos. Verifique que el adaptador USB a RS232 esté conectado.');
            return;
        }

        // Conectar al primer puerto (ajusta esto según tu configuración)
        // En Windows podría ser 'COM3', en Linux '/dev/ttyUSB0'
        const rutaPuerto = puertos[1].path;
        const { puerto, parser } = conectarPuerto(rutaPuerto, 9600);

        // Esperar a que el puerto se abra
        await new Promise(resolve => puerto.on('open', resolve));

        // Enviar un comando de ejemplo (ajusta según tu dispositivo)
        console.log('Enviando comando...');
        await enviarDatos(puerto, 'COMANDO\r\n');

        // Mantener la conexión abierta por un tiempo para recibir respuestas
        console.log('Esperando respuesta...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Cerrar el puerto
        await cerrarPuerto(puerto);
        console.log('Ejemplo completado');
    } catch (error) {
        console.error('Error en el ejemplo:', error.message);
    }
}

// Ejecutar el ejemplo
ejemploCompleto();