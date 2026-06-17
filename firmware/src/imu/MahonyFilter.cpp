#include "MahonyFilter.h"

#include <Arduino.h>
#include <math.h>

void MahonyFilter::begin(float /*sampleHz*/) {
  reset();
}

void MahonyFilter::reset() {
  q0_ = 1.0f;
  q1_ = 0.0f;
  q2_ = 0.0f;
  q3_ = 0.0f;
  integralX_ = 0.0f;
  integralY_ = 0.0f;
  integralZ_ = 0.0f;
}

void MahonyFilter::setGyroBias(float /*bx*/, float /*by*/, float /*bz*/) {
  // Bias is subtracted before calling update().
}

void MahonyFilter::update(float gx, float gy, float gz, float ax, float ay, float az, float dt) {
  float norm = sqrtf(ax * ax + ay * ay + az * az);
  if (norm < 1e-6f) {
    return;
  }
  ax /= norm;
  ay /= norm;
  az /= norm;

  float vx = 2.0f * (q1_ * q3_ - q0_ * q2_);
  float vy = 2.0f * (q0_ * q1_ + q2_ * q3_);
  float vz = q0_ * q0_ - q1_ * q1_ - q2_ * q2_ + q3_ * q3_;

  float ex = ay * vz - az * vy;
  float ey = az * vx - ax * vz;
  float ez = ax * vy - ay * vx;

  integralX_ += ex * ki_ * dt;
  integralY_ += ey * ki_ * dt;
  integralZ_ += ez * ki_ * dt;

  gx += kp_ * ex + integralX_;
  gy += kp_ * ey + integralY_;
  gz += kp_ * ez + integralZ_;

  const float halfDt = 0.5f * dt;
  q0_ += (-q1_ * gx - q2_ * gy - q3_ * gz) * halfDt;
  q1_ += (q0_ * gx + q2_ * gz - q3_ * gy) * halfDt;
  q2_ += (q0_ * gy - q1_ * gz + q3_ * gx) * halfDt;
  q3_ += (q0_ * gz + q1_ * gy - q2_ * gx) * halfDt;

  norm = sqrtf(q0_ * q0_ + q1_ * q1_ + q2_ * q2_ + q3_ * q3_);
  if (norm < 1e-6f) {
    reset();
    return;
  }
  q0_ /= norm;
  q1_ /= norm;
  q2_ /= norm;
  q3_ /= norm;
}

void MahonyFilter::getQuaternion(float q[4]) const {
  q[0] = q0_;
  q[1] = q1_;
  q[2] = q2_;
  q[3] = q3_;
}
