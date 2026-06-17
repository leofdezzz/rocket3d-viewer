#include "ImuManager.h"

#include <ArduinoJson.h>

#include <Arduino.h>

namespace {
constexpr float ACCEL_SCALE = 16384.0f;  // +/- 2g
constexpr float GYRO_SCALE = 131.0f;     // +/- 250 dps
}  // namespace

bool ImuManager::begin() {
  if (!mpu_.begin(I2C_SDA, I2C_SCL)) {
    Serial.println("{\"error\":\"mpu_probe_failed\"}");
    Serial.flush();
    return false;
  }

  JsonDocument doc;
  doc["status"] = "mpu6050_ok";
  doc["i2c_addr"] = mpu_.address();
  doc["who_am_i"] = mpu_.whoAmI();
  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();

  if (!calibrateGyro()) {
    Serial.println("{\"error\":\"gyro_cal_failed\"}");
    Serial.flush();
    return false;
  }

  filter_.begin(IMU_SAMPLE_HZ);
  lastMicros_ = micros();
  ready_ = true;
  return true;
}

bool ImuManager::calibrateGyro() {
  Serial.println("{\"status\":\"gyro_calibrating\"}");

  const unsigned long start = millis();
  float sumX = 0.0f;
  float sumY = 0.0f;
  float sumZ = 0.0f;
  uint32_t samples = 0;

  while (millis() - start < GYRO_CALIB_MS) {
    int16_t ax = 0;
    int16_t ay = 0;
    int16_t az = 0;
    int16_t gx = 0;
    int16_t gy = 0;
    int16_t gz = 0;
    if (mpu_.readRaw(ax, ay, az, gx, gy, gz)) {
      sumX += gx / GYRO_SCALE;
      sumY += gy / GYRO_SCALE;
      sumZ += gz / GYRO_SCALE;
      ++samples;
    }
    delay(5);
  }

  if (samples == 0) {
    return false;
  }

  gyroBiasX_ = sumX / static_cast<float>(samples);
  gyroBiasY_ = sumY / static_cast<float>(samples);
  gyroBiasZ_ = sumZ / static_cast<float>(samples);
  return true;
}

void ImuManager::update() {
  if (!ready_) {
    return;
  }

  int16_t axRaw = 0;
  int16_t ayRaw = 0;
  int16_t azRaw = 0;
  int16_t gxRaw = 0;
  int16_t gyRaw = 0;
  int16_t gzRaw = 0;
  if (!mpu_.readRaw(axRaw, ayRaw, azRaw, gxRaw, gyRaw, gzRaw)) {
    return;
  }

  const unsigned long now = micros();
  float dt = (now - lastMicros_) / 1000000.0f;
  lastMicros_ = now;
  if (dt <= 0.0f || dt > 0.2f) {
    dt = 1.0f / IMU_SAMPLE_HZ;
  }

  const float ax = axRaw / ACCEL_SCALE;
  const float ay = ayRaw / ACCEL_SCALE;
  const float az = azRaw / ACCEL_SCALE;
  const float gx = (gxRaw / GYRO_SCALE) - gyroBiasX_;
  const float gy = (gyRaw / GYRO_SCALE) - gyroBiasY_;
  const float gz = (gzRaw / GYRO_SCALE) - gyroBiasZ_;

  const float gyroRadX = gx * DEG_TO_RAD;
  const float gyroRadY = gy * DEG_TO_RAD;
  const float gyroRadZ = gz * DEG_TO_RAD;

  filter_.update(gyroRadX, gyroRadY, gyroRadZ, ax, ay, az, dt);

  float q[4];
  filter_.getQuaternion(q);
  q0_ = q[0];
  q1_ = q[1];
  q2_ = q[2];
  q3_ = q[3];
}

void ImuManager::getQuaternion(float q[4]) const {
  q[0] = q0_;
  q[1] = q1_;
  q[2] = q2_;
  q[3] = q3_;
}

void ImuManager::zeroReference() {
  filter_.reset();
  q0_ = 1.0f;
  q1_ = 0.0f;
  q2_ = 0.0f;
  q3_ = 0.0f;
}
