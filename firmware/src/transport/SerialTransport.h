#pragma once

#include <functional>

class SerialTransport {
public:
  void begin(unsigned long baud = 115200);
  void sendOrientation(unsigned long timestampMs, const float q[4], const float servo[2]);
  void pollCommands(std::function<void(const char* cmd)> cmdHandler,
                    std::function<void(float kp, float ki, float kd)> pidHandler);
};
