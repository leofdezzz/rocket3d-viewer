#pragma once

class MahonyFilter {
public:
  void begin(float sampleHz);
  void setGyroBias(float bx, float by, float bz);
  void update(float gx, float gy, float gz, float ax, float ay, float az, float dt);
  void getQuaternion(float q[4]) const;
  void reset();

private:
  float kp_ = 2.0f;
  float ki_ = 0.005f;
  float integralX_ = 0.0f;
  float integralY_ = 0.0f;
  float integralZ_ = 0.0f;
  float q0_ = 1.0f;
  float q1_ = 0.0f;
  float q2_ = 0.0f;
  float q3_ = 0.0f;
};
