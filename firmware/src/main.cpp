#include <Arduino.h>

#include "config.h"
#include "imu/I2cScan.h"
#include "imu/ImuManager.h"
#include "transport/SerialTransport.h"
#include "transport/WebSocketTransport.h"

ImuManager imu;
SerialTransport serialTransport;
WebSocketTransport wsTransport;

unsigned long lastSendMs = 0;
unsigned long lastLedToggleMs = 0;
unsigned long lastErrorReportMs = 0;
bool ledState = false;

void logJson(const char* key, const char* value) {
  Serial.printf("{\"%s\":\"%s\"}\n", key, value);
  Serial.flush();
}

void handleCommand(const char* cmd) {
  if (strcmp(cmd, "zero") == 0) {
    imu.zeroReference();
    logJson("status", "zeroed");
  }
}

void sendOrientation(unsigned long nowMs) {
  float q[4];
  imu.getQuaternion(q);
  serialTransport.sendOrientation(nowMs, q);
  wsTransport.broadcastOrientation(nowMs, q);
}

void reportImuFailure() {
  const unsigned long nowMs = millis();
  if (nowMs - lastErrorReportMs < 2000) {
    return;
  }
  lastErrorReportMs = nowMs;

  Serial.printf(
      "{\"error\":\"mpu6050_init_failed\",\"board\":\"%s\",\"hint\":\"check SDA=%d SCL=%d and 3.3V "
      "power\"}\n",
      BOARD_NAME,
      I2C_SDA,
      I2C_SCL);
  scanI2CBus();
  Serial.flush();
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LED_OFF);

  serialTransport.begin(115200);
  logJson("status", "boot");
  logJson("board", BOARD_NAME);

  initI2CBus(I2C_SDA, I2C_SCL);
  logI2CPins(I2C_SDA, I2C_SCL);
  logJson("status", "i2c_scan");
  scanI2CBus();

  logJson("status", "imu_init");
  if (!imu.begin()) {
    while (true) {
      reportImuFailure();
      digitalWrite(LED_PIN, digitalRead(LED_PIN) == LED_ON ? LED_OFF : LED_ON);
      delay(100);
    }
  }

  logJson("status", "ready");

  wsTransport.begin();
  wsTransport.onCommand(handleCommand);
}

void loop() {
  imu.update();
  wsTransport.loop();
  serialTransport.pollCommands(handleCommand);

  const unsigned long nowMs = millis();
  const unsigned long sendIntervalMs = static_cast<unsigned long>(1000.0f / SEND_HZ);

  if (nowMs - lastSendMs >= sendIntervalMs) {
    lastSendMs = nowMs;
    sendOrientation(nowMs);
  }

  const bool connected = wsTransport.hasClients();
  if (connected) {
    digitalWrite(LED_PIN, LED_ON);
  } else if (nowMs - lastLedToggleMs >= 500) {
    lastLedToggleMs = nowMs;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? LED_ON : LED_OFF);
  }
}
