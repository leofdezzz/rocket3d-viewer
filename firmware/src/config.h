#pragma once

// Seleccion de placa (ver platformio.ini):
// - esp32dev       → ESP32 clasico (WROOM)
// - esp32-c3-mini  → ESP32-C3 Mini / Super Mini
#if defined(BOARD_ESP32_C3_MINI)
constexpr int I2C_SDA = 5;
constexpr int I2C_SCL = 6;
constexpr int LED_PIN = 8;
constexpr bool LED_ACTIVE_LOW = true;
#else
constexpr int I2C_SDA = 21;
constexpr int I2C_SCL = 22;
constexpr int LED_PIN = 2;
constexpr bool LED_ACTIVE_LOW = false;
#endif

constexpr int LED_ON = LED_ACTIVE_LOW ? LOW : HIGH;
constexpr int LED_OFF = LED_ACTIVE_LOW ? HIGH : LOW;

// IMU sample rate target (Hz)
constexpr float IMU_SAMPLE_HZ = 100.0f;

// Orientation broadcast rate (Hz)
constexpr float SEND_HZ = 40.0f;

// Gyro calibration: keep device still for this duration at boot (ms)
constexpr unsigned long GYRO_CALIB_MS = 2000;

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
