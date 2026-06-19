#include "PidController.h"

namespace {
float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
}  // namespace

void PidController::begin(float kp, float ki, float kd, float outMax) {
  kp_ = kp;
  ki_ = ki;
  kd_ = kd;
  outMax_ = outMax;
  reset();
}

void PidController::setGains(float kp, float ki, float kd) {
  kp_ = kp;
  ki_ = ki;
  kd_ = kd;
}

void PidController::reset() {
  integral_ = 0.0f;
  prevError_ = 0.0f;
  hasPrev_ = false;
}

float PidController::compute(float error, float dt) {
  if (dt <= 0.0f) {
    return clampf(kp_ * error, -outMax_, outMax_);
  }

  integral_ += error * dt;
  // Anti-windup: limita el termino integral a la salida maxima.
  if (ki_ > 0.0f) {
    const float intLimit = outMax_ / ki_;
    integral_ = clampf(integral_, -intLimit, intLimit);
  } else {
    integral_ = 0.0f;
  }

  float derivative = 0.0f;
  if (hasPrev_) {
    derivative = (error - prevError_) / dt;
    derivative *= 0.35f;
  }
  prevError_ = error;
  hasPrev_ = true;

  const float out = kp_ * error + ki_ * integral_ + kd_ * derivative;
  return clampf(out, -outMax_, outMax_);
}
