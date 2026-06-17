#pragma once

// PID simple con anti-windup y clamp de salida.
class PidController {
public:
  void begin(float kp, float ki, float kd, float outMax);
  void setGains(float kp, float ki, float kd);
  void setOutputLimit(float outMax) { outMax_ = outMax; }

  // error = setpoint - measurement. dt en segundos.
  float compute(float error, float dt);

  void reset();

  float kp() const { return kp_; }
  float ki() const { return ki_; }
  float kd() const { return kd_; }

private:
  float kp_ = 0.0f;
  float ki_ = 0.0f;
  float kd_ = 0.0f;
  float outMax_ = 0.0f;
  float integral_ = 0.0f;
  float prevError_ = 0.0f;
  bool hasPrev_ = false;
};
