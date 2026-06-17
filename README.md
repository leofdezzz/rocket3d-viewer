# Rocket 3D Viewer

Visor web con un cohete 3D que replica en tiempo real la orientacion de un prototipo fisico basado en **ESP32 / ESP32-C3 + MPU6050**.

## Estructura

```
rocket3d-viewer/
├── firmware/     # PlatformIO + Arduino (ESP32 / ESP32-C3)
└── web/          # Vite + React + React Three Fiber
```

## Cableado MPU6050

### ESP32-C3 Mini (por defecto)

| MPU6050 | ESP32-C3 Mini |
|---------|----------------|
| VCC     | 3.3V           |
| GND     | GND            |
| SDA     | **GPIO 5**     |
| SCL     | **GPIO 6**     |

> El C3 **no tiene GPIO 22**. No uses el cableado del ESP32 clasico (21/22).
> GPIO 8 suele ser el LED integrado; por eso I2C va en 5/6.

### ESP32 clasico (DevKit WROOM)

| MPU6050 | ESP32 |
|---------|-------|
| VCC     | 3.3V  |
| GND     | GND   |
| SDA     | GPIO 21 |
| SCL     | GPIO 22 |

Monta el MPU6050 rigidamente al cuerpo del cohete. Los pines I2C se cambian en `firmware/src/config.h`.

## TVC (control vectorial de empuje) con PID

Demo: dos servos **MG90S** en cardan (gimbal) desvian la tobera del motor para "rectificar" el cohete. Es solo demostracion (no hay empuje real): al rotar el cohete en cualquier eje, los servos giran la tobera en sentido opuesto a la inclinacion mediante un controlador **PID**.

- Servo **X** → coincide con el eje X del MPU6050.
- Servo **Y** (montado encima) → coincide con el eje Y del MPU6050.

El firmware lee la inclinacion del IMU, corre 2 PID (uno por eje) y mueve los servos. La web muestra el cardan + tobera en 3D y permite ajustar `Kp/Ki/Kd` en vivo. En modo Simulador el PID corre en el navegador.

### Cableado servos

#### ESP32-C3 Mini (por defecto)

| MG90S | ESP32-C3 Mini |
|-------|----------------|
| Señal X | **GPIO 3** |
| Señal Y | **GPIO 4** |
| VCC | 5V (fuente externa recomendada) |
| GND | GND (comun con el ESP32) |

#### ESP32 clasico

| MG90S | ESP32 |
|-------|-------|
| Señal X | GPIO 18 |
| Señal Y | GPIO 19 |
| VCC | 5V |
| GND | GND |

> Los MG90S consumen picos de corriente; aliméntalos con una fuente de 5V dedicada y une las masas (GND comun). Pines, limites de desvio y ganancias PID por defecto estan en `firmware/src/config.h`.

## Firmware

### Requisitos

- [PlatformIO](https://platformio.org/)

### Compilar y flashear

**ESP32-C3 Mini** (entorno por defecto):

```bash
cd firmware
pio run -e esp32-c3-mini -t upload
pio device monitor -e esp32-c3-mini
```

**ESP32 clasico**:

```bash
pio run -e esp32dev -t upload
pio device monitor -e esp32dev
```

En el C3 el serial va por **USB nativo** (no hace falta adaptador UART externo). Si el upload falla, mantén pulsado **BOOT**, pulsa **RESET**, suelta **RESET** y reintenta upload.

Al arrancar deberías ver `"board":"esp32-c3-mini"` en el monitor serial.

### WiFi

Por defecto el ESP32 crea un punto de acceso:

- SSID: `RocketViewer`
- Password: `rocket123`
- IP: `192.168.4.1`
- WebSocket: `ws://192.168.4.1:81/`

Para unirse a tu red WiFi, descomenta `#define WIFI_USE_STA` en `firmware/src/config.h` y configura `WIFI_SSID` / `WIFI_PASS`.

### Formato de datos

Cada linea JSON (serial y WebSocket):

```json
{"t":123456,"q":[w,x,y,z],"s":[servoX,servoY]}
```

`s` es el desvio actual de los servos TVC en grados.

Comandos entrantes:

```json
{"cmd":"zero"}
{"cmd":"pid","kp":0.8,"ki":0.15,"kd":0.05}
```

## Web

### Requisitos

- Node.js 18+

### Desarrollo

```bash
cd web
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

### Modos de conexion

1. **Simulador** (por defecto): animacion de prueba sin hardware.
2. **WebSocket**: conecta al ESP32 por WiFi.
3. **Serial USB**: Web Serial API (Chrome/Edge, localhost o HTTPS).

### Calibracion

Pulsa **Calibrar cero** con el cohete en la posicion de referencia deseada. La orientacion actual del IMU se tomara como vertical en pantalla.

## Solución de problemas

### La web dice conectado pero no se mueve / 0 Hz

1. **Cierra `pio device monitor`** y desconecta Serial USB en la web antes de volver a probar. Solo un programa puede usar el puerto.
2. Pulsa el botón **RESET** del ESP32 mientras la web está conectada por Serial USB.
3. Deberías ver **~40 Hz** en el panel. Si sigue en 0 Hz, el ESP32 no está enviando datos.

### El monitor serial no muestra nada

- Si la web tiene Serial USB abierto, el monitor de PlatformIO **no verá nada**. Desconecta primero en la web.
- Prueba solo con monitor:
  ```bash
  cd firmware
  pio device monitor
  ```
- Pulsa **RESET** en la placa. Deberías ver:
  ```json
  {"status":"boot"}
  {"status":"imu_init"}
  {"status":"mpu6050_ok","i2c_addr":104}
  {"status":"gyro_calibrating"}
  {"status":"ready"}
  {"t":1234,"q":[1,0,0,0]}
  ```

### Error `mpu6050_init_failed`

El IMU no responde por I2C. Revisa:

| MPU6050 | ESP32 |
|---------|-------|
| VCC | **3.3V** (no 5V) |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |

El firmware también escanea el bus I2C cada 2 s y muestra dispositivos detectados, por ejemplo `{"i2c":[104]}` (104 = 0x68).

Si AD0 del MPU6050 está a HIGH, la dirección es 0x69; el firmware prueba ambas automáticamente.

### LED parpadeando muy rápido

El MPU6050 no inicializó. Revisa cableado y alimentación 3.3V.

## Limitaciones

- El MPU6050 no incluye magnetometro: el **yaw absoluto deriva** con el tiempo.
- Pitch y roll son fiables para inclinacion del prototipo.
- Para yaw estable, considera MPU9250 o un magnetometro externo.

## Reemplazar el modelo 3D

El visor carga `web/public/models/spacex_starship_spacecraft.glb` (SpaceX Starship).

Para usar otro GLB:

1. Coloca el archivo en `web/public/models/`.
2. Cambia `ROCKET_MODEL_URL` en `web/src/components/RocketModel.tsx`.
3. Si la orientación en reposo no cuadra, ajusta `MODEL_ROTATION` en el mismo archivo o usa **Calibrar cero** en la web.

El placeholder procedural sigue en `web/src/components/RocketPlaceholder.tsx` por si quieres volver a usarlo.

## Pruebas recomendadas

| Prueba | Criterio |
|--------|----------|
| Serial | Al inclinar el prototipo, el cohete 3D sigue en menos de 100 ms |
| WebSocket | Misma respuesta via WiFi a 2-3 m |
| Calibrar cero | Posicion actual = vertical en pantalla |
| Reconexion | Desconectar y reconectar sin recargar la pagina |

## LED del ESP32

- Parpadeo: sin clientes WebSocket conectados.
- Fijo: al menos un cliente WebSocket activo.
