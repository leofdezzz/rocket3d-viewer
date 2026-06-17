#pragma once

// Controla los 2 servos MG90S del gimbal de empuje via LEDC.
class ServoTvc {
public:
  void begin();

  // Desvio en grados desde el centro (+/- SERVO_MAX_DEFLECT_DEG).
  // deflectX -> servo alineado con eje X del MPU, deflectY -> eje Z.
  void setDeflection(float deflectXDeg, float deflectYDeg);

  void center();

private:
  void writeAngle(int pin, float angleDeg);

  bool ready_ = false;
};
