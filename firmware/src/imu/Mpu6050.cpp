#include "Mpu6050.h"

#include <Arduino.h>
#include <math.h>

namespace {
constexpr uint8_t REG_PWR_MGMT_1 = 0x6B;
constexpr uint8_t REG_SMPLRT_DIV = 0x19;
constexpr uint8_t REG_CONFIG = 0x1A;
constexpr uint8_t REG_GYRO_CONFIG = 0x1B;
constexpr uint8_t REG_ACCEL_CONFIG = 0x1C;
constexpr uint8_t REG_ACCEL_XOUT_H = 0x3B;
constexpr uint8_t REG_WHO_AM_I = 0x75;
constexpr float ACCEL_SCALE = 16384.0f;
}  // namespace

bool Mpu6050::isKnownWhoAmI(uint8_t whoAmI) {
  switch (whoAmI) {
    case 0x68:  // MPU6050
    case 0x70:  // MPU6500
    case 0x71:  // MPU9250
    case 0x73:  // MPU9255
    case 0x74:  // clone GY-521 / MPU6887 variant
      return true;
    default:
      return false;
  }
}

bool Mpu6050::writeByte(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(address_);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool Mpu6050::readBytes(uint8_t reg, uint8_t* buffer, size_t length) {
  Wire.beginTransmission(address_);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }
  const uint8_t received = Wire.requestFrom(address_, static_cast<uint8_t>(length));
  if (received != length) {
    return false;
  }
  for (size_t i = 0; i < length; ++i) {
    buffer[i] = Wire.read();
  }
  return true;
}

bool Mpu6050::probe(uint8_t address) {
  address_ = address;

  if (!writeByte(REG_PWR_MGMT_1, 0x00)) {
    return false;
  }
  delay(100);

  uint8_t whoAmI = 0;
  if (!readBytes(REG_WHO_AM_I, &whoAmI, 1)) {
    Serial.printf("{\"mpu_debug\":\"whoami_read_failed\",\"i2c_addr\":%u}\n", address);
    Serial.flush();
    return false;
  }

  whoAmI_ = whoAmI;
  Serial.printf("{\"who_am_i\":%u,\"i2c_addr\":%u}\n", whoAmI, address);
  Serial.flush();

  if (!isKnownWhoAmI(whoAmI)) {
    Serial.printf("{\"warning\":\"unknown_who_am_i\",\"value\":%u,\"action\":\"trying_anyway\"}\n", whoAmI);
    Serial.flush();
  }

  return true;
}

bool Mpu6050::initChip() {
  if (!writeByte(REG_PWR_MGMT_1, 0x01)) {
    Serial.println("{\"mpu_debug\":\"pwr_mgmt_failed\"}");
    return false;
  }
  if (!writeByte(REG_SMPLRT_DIV, 0x04)) {
    Serial.println("{\"mpu_debug\":\"smplrt_failed\"}");
    return false;
  }
  if (!writeByte(REG_CONFIG, 0x03)) {
    Serial.println("{\"mpu_debug\":\"config_failed\"}");
    return false;
  }
  if (!writeByte(REG_GYRO_CONFIG, 0x08)) {
    Serial.println("{\"mpu_debug\":\"gyro_cfg_failed\"}");
    return false;
  }
  if (!writeByte(REG_ACCEL_CONFIG, 0x08)) {
    Serial.println("{\"mpu_debug\":\"accel_cfg_failed\"}");
    return false;
  }

  delay(100);
  return true;
}

bool Mpu6050::verifyData() {
  int16_t ax = 0;
  int16_t ay = 0;
  int16_t az = 0;
  int16_t gx = 0;
  int16_t gy = 0;
  int16_t gz = 0;

  for (uint8_t attempt = 0; attempt < 5; ++attempt) {
    if (!readRaw(ax, ay, az, gx, gy, gz)) {
      delay(20);
      continue;
    }

    const float magnitude =
        sqrtf(static_cast<float>(ax * ax + ay * ay + az * az)) / ACCEL_SCALE;
    if (magnitude > 0.3f && magnitude < 3.5f) {
      Serial.printf("{\"status\":\"imu_data_ok\",\"accel_g\":%.2f}\n", magnitude);
      Serial.flush();
      return true;
    }
    delay(20);
  }

  Serial.println("{\"mpu_debug\":\"verify_data_failed\"}");
  Serial.flush();
  return false;
}

bool Mpu6050::tryBus(int sda, int scl, bool swapped) {
  Wire.begin(sda, scl);
  Wire.setClock(100000);
  delay(50);

  const uint8_t candidates[] = {0x68, 0x69};
  for (const uint8_t candidate : candidates) {
    if (probe(candidate) && initChip() && verifyData()) {
      usedSwappedPins_ = swapped;
      return true;
    }
  }

  return false;
}

bool Mpu6050::begin(int sda, int scl) {
  usedSwappedPins_ = false;
  whoAmI_ = 0;
  address_ = 0x68;

  if (tryBus(sda, scl, false)) {
    return true;
  }

  if (tryBus(scl, sda, true)) {
    Serial.println("{\"warning\":\"using_swapped_sda_scl\"}");
    Serial.flush();
    return true;
  }

  return false;
}

bool Mpu6050::readRaw(int16_t& ax, int16_t& ay, int16_t& az, int16_t& gx, int16_t& gy, int16_t& gz) {
  uint8_t buffer[14];
  if (!readBytes(REG_ACCEL_XOUT_H, buffer, sizeof(buffer))) {
    return false;
  }

  ax = static_cast<int16_t>((buffer[0] << 8) | buffer[1]);
  ay = static_cast<int16_t>((buffer[2] << 8) | buffer[3]);
  az = static_cast<int16_t>((buffer[4] << 8) | buffer[5]);
  gx = static_cast<int16_t>((buffer[8] << 8) | buffer[9]);
  gy = static_cast<int16_t>((buffer[10] << 8) | buffer[11]);
  gz = static_cast<int16_t>((buffer[12] << 8) | buffer[13]);
  return true;
}
