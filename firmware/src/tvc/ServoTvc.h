#pragma once

// Controla los 2 servos MG90S del gimbal via ESP32Servo (LEDC con timers reservados).
class ServoTvc {
public:
  void begin();
  bool isReady() const;

  // Desvio en grados desde el centro (+/- SERVO_MAX_DEFLECT_DEG).
  // deflectX -> servo alineado con eje X del MPU, deflectY -> eje Z.
  void setDeflection(float deflectXDeg, float deflectYDeg);

  void center();

  // Barrido 75-90-105-90 para verificar cableado y PWM.
  void runSelfTest();

  int readPulseUsX() const;
  int readPulseUsY() const;

private:
  void writeAngle(int pin, float angleDeg);

  bool ready_ = false;
};
