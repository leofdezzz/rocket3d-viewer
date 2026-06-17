#pragma once

// Seleccion de placa (ver platformio.ini):
// - esp32dev       → ESP32 clasico (WROOM)
// - esp32-c3-mini  → ESP32-C3 Mini / Super Mini
#if defined(BOARD_ESP32_C3_MINI)
constexpr int I2C_SDA = 5;
constexpr int I2C_SCL = 6;
constexpr int LED_PIN = 8;
constexpr bool LED_ACTIVE_LOW = true;
// Servos MG90S del TVC (I2C en 5/6, LED en 8 -> 3/4 libres)
constexpr int SERVO_X_PIN = 3;
constexpr int SERVO_Y_PIN = 4;
#else
constexpr int I2C_SDA = 21;
constexpr int I2C_SCL = 22;
constexpr int LED_PIN = 2;
constexpr bool LED_ACTIVE_LOW = false;
constexpr int SERVO_X_PIN = 18;
constexpr int SERVO_Y_PIN = 19;
#endif

constexpr int LED_ON = LED_ACTIVE_LOW ? LOW : HIGH;
constexpr int LED_OFF = LED_ACTIVE_LOW ? HIGH : LOW;

// IMU sample rate target (Hz)
constexpr float IMU_SAMPLE_HZ = 100.0f;

// Orientation broadcast rate (Hz)
constexpr float SEND_HZ = 40.0f;

// Gyro calibration: keep device still for this duration at boot (ms)
constexpr unsigned long GYRO_CALIB_MS = 2000;

// ---- TVC (Thrust Vector Control) ----
// Lazo de control PID -> servos (Hz)
constexpr float CONTROL_HZ = 100.0f;

// PWM servos MG90S (LEDC)
constexpr float SERVO_PWM_HZ = 50.0f;
constexpr int SERVO_PWM_BITS = 14;          // 16384 cuentas por periodo de 20 ms
constexpr int SERVO_MIN_US = 500;           // ~0 grados
constexpr int SERVO_MAX_US = 2400;          // ~180 grados
constexpr float SERVO_CENTER_DEG = 90.0f;   // neutro
constexpr float SERVO_MAX_DEFLECT_DEG = 35.0f;  // desvio max +/- desde el centro

// Ganancias PID por defecto (error en grados de inclinacion -> grados de desvio servo)
constexpr float PID_KP = 0.8f;
constexpr float PID_KI = 0.15f;
constexpr float PID_KD = 0.05f;

// WiFi mode: comment out WIFI_USE_STA to use Access Point mode
// #define WIFI_USE_STA

#ifdef WIFI_USE_STA
constexpr const char* WIFI_SSID = "YOUR_SSID";
constexpr const char* WIFI_PASS = "YOUR_PASSWORD";
#else
constexpr const char* AP_SSID = "RocketViewer";
constexpr const char* AP_PASS = "rocket123";
#endif

constexpr uint16_t WS_PORT = 81;

#if defined(BOARD_ESP32_C3_MINI)
constexpr const char* BOARD_NAME = "esp32-c3-mini";
#else
constexpr const char* BOARD_NAME = "esp32dev";
#endif
