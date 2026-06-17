#pragma once

#include <functional>

class SerialTransport {
public:
  void begin(unsigned long baud = 115200);
  void sendOrientation(unsigned long timestampMs, const float q[4]);
  void pollCommands(std::function<void(const char* cmd)> handler);
};
