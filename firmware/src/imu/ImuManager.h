#pragma once

#include "MahonyFilter.h"
#include "Mpu6050.h"

#include "../config.h"

class ImuManager {
public:
  bool begin();
  void update();
  void getQuaternion(float q[4]) const;
  // Inclinacion del eje +Y (nariz, MPU vertical). tiltX -> servo X, tiltY -> servo Z.
  void getTilt(float& tiltXDeg, float& tiltYDeg) const;
  void zeroReference();

  bool isReady() const { return ready_; }

private:
  bool calibrateGyro();

  Mpu6050 mpu_;
  MahonyFilter filter_;
  float gyroBiasX_ = 0.0f;
  float gyroBiasY_ = 0.0f;
  float gyroBiasZ_ = 0.0f;
  float q0_ = 1.0f;
  float q1_ = 0.0f;
  float q2_ = 0.0f;
  float q3_ = 0.0f;
  unsigned long lastMicros_ = 0;
  bool ready_ = false;
};
