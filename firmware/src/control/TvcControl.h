#pragma once

#include "PidController.h"

// Lazo TVC: inclinacion filtrada -> PID -> desvio de servo con deadband y limite de velocidad.
class TvcControl {
public:
  void begin(float kp, float ki, float kd, float outMax);
  void setGains(float kp, float ki, float kd);
  void reset();

  // tiltX/tiltY en grados (ImuManager::getTilt). dt en segundos.
  void update(float tiltX, float tiltY, float dt, float& servoX, float& servoY);

private:
  PidController pidX_;
  PidController pidY_;
  float smoothTiltX_ = 0.0f;
  float smoothTiltY_ = 0.0f;
  float servoX_ = 0.0f;
  float servoY_ = 0.0f;
};
