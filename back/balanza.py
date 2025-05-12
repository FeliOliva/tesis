import asyncio
import serial
import websockets
import json
from datetime import datetime

# Configuración del puerto serial
puerto = serial.Serial(
    port="COM4",  # /dev/ttyUSB0 en ubuntu
    baudrate=9600,
    bytesize=serial.EIGHTBITS,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    timeout=1,
)

WS_URI = "ws://localhost:3000"


def parsear_peso(respuesta_raw):
    try:
        texto = respuesta_raw.decode(errors="ignore")
        print(f"{datetime.now().strftime('%H:%M:%S')} >> Texto recibido: {texto}")

        if "\x02" in texto:
            datos = texto.split("\x02")[-1]
            # Eliminar caracteres no numéricos
            peso_str = "".join(filter(str.isdigit, datos[:6]))
            if peso_str:
                peso_int = int(peso_str)
                return peso_int
        return None
    except Exception as e:
        print(f"❌ Error al parsear: {e}")
        return None


async def manejar_conexion():
    reconnect_delay = 5  # segundos entre reconexiones
    while True:
        try:
            print(f"🔗 Conectando a WebSocket en {WS_URI}...")
            async with websockets.connect(
                WS_URI, ping_interval=30, ping_timeout=60
            ) as websocket:
                print("✅ Conexión WebSocket establecida")
                reconnect_delay = 5  # Resetear el delay después de conexión exitosa

                while True:
                    try:
                        # Leer peso de la balanza
                        puerto.reset_input_buffer()
                        puerto.write(b"\x05")
                        await asyncio.sleep(0.3)

                        if puerto.in_waiting:
                            respuesta = puerto.read(puerto.in_waiting)
                            peso = parsear_peso(respuesta)

                            if peso is not None:
                                print(f"⚖️ Peso leído: {peso} gramos")
                                mensaje = json.dumps(
                                    {
                                        "tipo": "peso",
                                        "valor": peso,
                                        "timestamp": datetime.now().isoformat(),
                                    }
                                )
                                await websocket.send(mensaje)
                                print(f"📤 Peso enviado: {peso}g")

                        await asyncio.sleep(1)  # Intervalo de lectura

                    except (websockets.ConnectionClosed, serial.SerialException) as e:
                        print(f"⚠️ Error de conexión: {e}, reconectando...")
                        break
                    except Exception as e:
                        print(f"❌ Error inesperado: {e}")
                        await asyncio.sleep(1)

        except Exception as e:
            print(f"🚨 Error al conectar: {e}, reintentando en {reconnect_delay}s...")
            await asyncio.sleep(reconnect_delay)
            reconnect_delay = min(
                reconnect_delay * 2, 60
            )  # Backoff exponencial hasta 60s


async def main():
    try:
        await manejar_conexion()
    except KeyboardInterrupt:
        print("\n🔌 Cerrando conexiones...")
        puerto.close()
    except Exception as e:
        print(f"🚨 Error crítico: {e}")
    finally:
        if puerto.is_open:
            puerto.close()


if __name__ == "__main__":
    asyncio.run(main())
