#include "ServoTvc.h"

#include <Arduino.h>

#include "../config.h"

namespace {
constexpr uint8_t SERVO_X_CHANNEL = 0;
constexpr uint8_t SERVO_Y_CHANNEL = 1;

float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

uint8_t channelForPin(int pin) {
  return pin == SERVO_Y_PIN ? SERVO_Y_CHANNEL : SERVO_X_CHANNEL;
}

bool setupServoChannel(int pin, uint8_t channel) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  return ledcAttach(pin, SERVO_PWM_HZ, SERVO_PWM_BITS);
#else
  ledcSetup(channel, SERVO_PWM_HZ, SERVO_PWM_BITS);
  ledcAttachPin(pin, channel);
  return true;
#endif
}

void writeServoDuty(int pin, uint32_t duty) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(pin, duty);
#else
  ledcWrite(channelForPin(pin), duty);
#endif
}
}  // namespace

void ServoTvc::begin() {
  ready_ = setupServoChannel(SERVO_X_PIN, SERVO_X_CHANNEL) &&
           setupServoChannel(SERVO_Y_PIN, SERVO_Y_CHANNEL);
  center();
}

void ServoTvc::center() {
  setDeflection(0.0f, 0.0f);
}

void ServoTvc::setDeflection(float deflectXDeg, float deflectYDeg) {
  const float dx = clampf(deflectXDeg, -SERVO_MAX_DEFLECT_DEG, SERVO_MAX_DEFLECT_DEG);
  const float dy = clampf(deflectYDeg, -SERVO_MAX_DEFLECT_DEG, SERVO_MAX_DEFLECT_DEG);
  writeAngle(SERVO_X_PIN, SERVO_CENTER_DEG + dx);
  writeAngle(SERVO_Y_PIN, SERVO_CENTER_DEG + dy);
}

void ServoTvc::writeAngle(int pin, float angleDeg) {
  if (!ready_) {
    return;
  }
  const float angle = clampf(angleDeg, 0.0f, 180.0f);
  const float us = SERVO_MIN_US + (SERVO_MAX_US - SERVO_MIN_US) * (angle / 180.0f);
  const float periodUs = 1000000.0f / SERVO_PWM_HZ;
  const uint32_t maxCount = (1u << SERVO_PWM_BITS);
  const uint32_t duty = static_cast<uint32_t>((us / periodUs) * maxCount);
  writeServoDuty(pin, duty);
}
