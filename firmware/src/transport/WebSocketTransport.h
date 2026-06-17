#pragma once

#include <functional>

#include <WebSocketsServer.h>
#include <WiFi.h>

#include "../config.h"

class WebSocketTransport {
public:
  void begin();
  void loop();
  void broadcastOrientation(unsigned long timestampMs, const float q[4]);
  bool hasClients();
  void onCommand(std::function<void(const char* cmd)> handler);

private:
  WebSocketsServer server_{WS_PORT, "", "orientation"};
  std::function<void(const char* cmd)> commandHandler_;
  static void staticEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);
  void handleEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);

  static WebSocketTransport* instance_;
};
