#include <Arduino.h>

#include "config.h"
#include "control/PidController.h"
#include "imu/I2cScan.h"
#include "imu/ImuManager.h"
#include "transport/SerialTransport.h"
#include "transport/WebSocketTransport.h"
#include "tvc/ServoTvc.h"

ImuManager imu;
SerialTransport serialTransport;
WebSocketTransport wsTransport;
ServoTvc servoTvc;
PidController pidX;
PidController pidY;

unsigned long lastSendMs = 0;
unsigned long lastControlMs = 0;
unsigned long lastControlMicros = 0;
unsigned long lastLedToggleMs = 0;
unsigned long lastErrorReportMs = 0;
bool ledState = false;

// Desvio actual de los servos en grados (para telemetria).
float servoDeflect[2] = {0.0f, 0.0f};

void logJson(const char* key, const char* value) {
  Serial.printf("{\"%s\":\"%s\"}\n", key, value);
  Serial.flush();
}

void handleCommand(const char* cmd) {
  if (strcmp(cmd, "zero") == 0) {
    imu.zeroReference();
    pidX.reset();
    pidY.reset();
    logJson("status", "zeroed");
  }
}

void handlePidGains(float kp, float ki, float kd) {
  pidX.setGains(kp, ki, kd);
  pidY.setGains(kp, ki, kd);
  Serial.printf("{\"status\":\"pid\",\"kp\":%.4f,\"ki\":%.4f,\"kd\":%.4f}\n", kp, ki, kd);
  Serial.flush();
}

// Lazo de control: inclinacion del IMU -> PID -> desvio de servos (opuesto al tilt).
void runControl(unsigned long nowMs) {
  const unsigned long nowMicros = micros();
  float dt = (nowMicros - lastControlMicros) / 1000000.0f;
  lastControlMicros = nowMicros;
  if (dt <= 0.0f || dt > 0.2f) {
    dt = 1.0f / CONTROL_HZ;
  }

  float tiltX = 0.0f;
  float tiltY = 0.0f;
  imu.getTilt(tiltX, tiltY);

  // Error = +tilt (invertido respecto a inclinacion para corregir en el sentido correcto).
  servoDeflect[0] = pidX.compute(tiltX, dt);
  servoDeflect[1] = pidY.compute(tiltY, dt);
  servoTvc.setDeflection(servoDeflect[0], servoDeflect[1]);
}

void sendOrientation(unsigned long nowMs) {
  float q[4];
  imu.getQuaternion(q);
  serialTransport.sendOrientation(nowMs, q, servoDeflect);
  wsTransport.broadcastOrientation(nowMs, q, servoDeflect);
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

  servoTvc.begin();
  pidX.begin(PID_KP, PID_KI, PID_KD, SERVO_MAX_DEFLECT_DEG);
  pidY.begin(PID_KP, PID_KI, PID_KD, SERVO_MAX_DEFLECT_DEG);
  lastControlMicros = micros();

  logJson("status", "ready");

  wsTransport.begin();
  wsTransport.onCommand(handleCommand);
  wsTransport.onPidGains(handlePidGains);
}

void loop() {
  imu.update();
  wsTransport.loop();
  serialTransport.pollCommands(handleCommand, handlePidGains);

  const unsigned long nowMs = millis();
  const unsigned long controlIntervalMs = static_cast<unsigned long>(1000.0f / CONTROL_HZ);
  if (nowMs - lastControlMs >= controlIntervalMs) {
    lastControlMs = nowMs;
    runControl(nowMs);
  }

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
