#include <Arduino.h>
#include <math.h>

#include "TvcControl.h"

#include "../config.h"

namespace {
float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

float applyDeadband(float v, float deadbandDeg) {
  if (fabsf(v) < deadbandDeg) {
    return 0.0f;
  }
  return v;
}
}  // namespace

void TvcControl::begin(float kp, float ki, float kd, float outMax) {
  pidX_.begin(kp, ki, kd, outMax);
  pidY_.begin(kp, ki, kd, outMax);
  reset();
}

void TvcControl::setGains(float kp, float ki, float kd) {
  pidX_.setGains(kp, ki, kd);
  pidY_.setGains(kp, ki, kd);
}

void TvcControl::reset() {
  pidX_.reset();
  pidY_.reset();
  smoothTiltX_ = 0.0f;
  smoothTiltY_ = 0.0f;
  servoX_ = 0.0f;
  servoY_ = 0.0f;
}

void TvcControl::update(float tiltX, float tiltY, float dt, float& servoX, float& servoY) {
  // Suaviza ruido del IMU (EMA).
  smoothTiltX_ += TILT_FILTER_ALPHA * (tiltX - smoothTiltX_);
  smoothTiltY_ += TILT_FILTER_ALPHA * (tiltY - smoothTiltY_);

  const float tx = applyDeadband(smoothTiltX_, TILT_DEADBAND_DEG);
  const float ty = applyDeadband(smoothTiltY_, TILT_DEADBAND_DEG);

  // Misma convencion que la web: servoX ~ tiltX, servoY ~ -tiltY.
  const float targetX = pidX_.compute(tx * SERVO_SIGN_X, dt);
  const float targetY = pidY_.compute(ty * SERVO_SIGN_Y, dt);

  // Limita velocidad para evitar sacudidas y picos del derivativo.
  servoX_ += clampf(targetX - servoX_, -SERVO_MAX_STEP_DEG, SERVO_MAX_STEP_DEG);
  servoY_ += clampf(targetY - servoY_, -SERVO_MAX_STEP_DEG, SERVO_MAX_STEP_DEG);

  servoX = servoX_;
  servoY = servoY_;
}
