#include "ServoTvc.h"

#include <Arduino.h>
#include <ESP32Servo.h>

#include "../config.h"

namespace {
Servo servoX;
Servo servoY;
bool readyX = false;
bool readyY = false;

float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

void allocatePwmTimers() {
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
}

bool attachServo(Servo& servo, int pin, int minUs, int maxUs) {
  servo.setPeriodHertz(static_cast<int>(SERVO_PWM_HZ));
  const int channel = servo.attach(pin, minUs, maxUs);
  return channel != 0;
}

void logServoAttach(int pin, bool ok) {
  Serial.printf("{\"servo_pin\":%d,\"attach\":%s}\n", pin, ok ? "ok" : "fail");
  Serial.flush();
}
}  // namespace

void ServoTvc::begin() {
  allocatePwmTimers();

  readyX = attachServo(servoX, SERVO_X_PIN, SERVO_MIN_US, SERVO_MAX_US);
  readyY = attachServo(servoY, SERVO_Y_PIN, SERVO_MIN_US, SERVO_MAX_US);

  logServoAttach(SERVO_X_PIN, readyX);
  logServoAttach(SERVO_Y_PIN, readyY);

  ready_ = readyX && readyY;
  center();
}

bool ServoTvc::isReady() const {
  return ready_;
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
  const float angle = clampf(angleDeg, 0.0f, 180.0f);
  const int pulseDeg = static_cast<int>(angle);

  if (pin == SERVO_X_PIN && readyX) {
    servoX.write(pulseDeg);
  } else if (pin == SERVO_Y_PIN && readyY) {
    servoY.write(pulseDeg);
  }
}

void ServoTvc::runSelfTest() {
  if (!ready_) {
    Serial.println("{\"error\":\"servo_not_ready\"}");
    Serial.flush();
    return;
  }

  Serial.println("{\"status\":\"servo_test\"}");
  Serial.flush();

  constexpr int sweep[] = {75, 90, 105, 90};
  for (int target : sweep) {
    servoX.write(target);
    servoY.write(target);
    Serial.printf("{\"servo_test_angle\":%d}\n", target);
    Serial.flush();
    delay(400);
  }
  center();
  Serial.println("{\"status\":\"servo_test_done\"}");
  Serial.flush();
}

int ServoTvc::readPulseUsX() const {
  return readyX ? servoX.readMicroseconds() : 0;
}

int ServoTvc::readPulseUsY() const {
  return readyY ? servoY.readMicroseconds() : 0;
}
