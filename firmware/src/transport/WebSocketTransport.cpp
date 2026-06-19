#include "WebSocketTransport.h"

#include <ArduinoJson.h>
#include <cstring>
#include <functional>

WebSocketTransport* WebSocketTransport::instance_ = nullptr;

void WebSocketTransport::staticEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (instance_ != nullptr) {
    instance_->handleEvent(num, type, payload, length);
  }
}

void WebSocketTransport::begin() {
  instance_ = this;

#ifdef WIFI_USE_STA
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
  }
#else
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);
  WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));
#endif

  server_.begin();
  server_.onEvent(staticEvent);
}

void WebSocketTransport::loop() {
  server_.loop();
}

bool WebSocketTransport::hasClients() {
  return server_.connectedClients() > 0;
}

void WebSocketTransport::onCommand(std::function<void(const char* cmd)> handler) {
  commandHandler_ = std::move(handler);
}

void WebSocketTransport::onPidGains(std::function<void(float kp, float ki, float kd)> handler) {
  pidHandler_ = std::move(handler);
}

void WebSocketTransport::handleEvent(uint8_t /*num*/, WStype_t type, uint8_t* payload, size_t length) {
  if (type != WStype_TEXT || payload == nullptr) {
    return;
  }

  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    return;
  }

  const char* cmd = doc["cmd"];
  if (cmd == nullptr) {
    return;
  }
  if (strcmp(cmd, "pid") == 0 && pidHandler_) {
    pidHandler_(doc["kp"] | 0.0f, doc["ki"] | 0.0f, doc["kd"] | 0.0f);
  } else if (commandHandler_) {
    commandHandler_(cmd);
  }
}

void WebSocketTransport::broadcastOrientation(unsigned long timestampMs, const float q[4], const float servo[2]) {
  JsonDocument doc;
  doc["t"] = timestampMs;
  JsonArray quat = doc["q"].to<JsonArray>();
  quat.add(q[0]);
  quat.add(q[1]);
  quat.add(q[2]);
  quat.add(q[3]);
  if (servo != nullptr) {
    JsonArray srv = doc["s"].to<JsonArray>();
    srv.add(servo[0]);
    srv.add(servo[1]);
  }

  char buffer[128];
  const size_t len = serializeJson(doc, buffer, sizeof(buffer));
  if (len > 0) {
    server_.broadcastTXT(buffer, len);
  }
}
