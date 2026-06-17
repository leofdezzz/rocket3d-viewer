#pragma once

#include <Wire.h>

class Mpu6050 {
public:
  bool begin(int sda, int scl);
  bool readRaw(int16_t& ax, int16_t& ay, int16_t& az, int16_t& gx, int16_t& gy, int16_t& gz);
  uint8_t address() const { return address_; }
  uint8_t whoAmI() const { return whoAmI_; }
  bool usedSwappedPins() const { return usedSwappedPins_; }

private:
  uint8_t address_ = 0x68;
  uint8_t whoAmI_ = 0;
  bool usedSwappedPins_ = false;

  static bool isKnownWhoAmI(uint8_t whoAmI);
  bool tryBus(int sda, int scl, bool swapped);
  bool probe(uint8_t address);
  bool initChip();
  bool verifyData();
  bool writeByte(uint8_t reg, uint8_t value);
  bool readBytes(uint8_t reg, uint8_t* buffer, size_t length);
};
