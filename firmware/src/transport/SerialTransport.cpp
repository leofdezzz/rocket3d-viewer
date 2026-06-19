#include "SerialTransport.h"

#include <ArduinoJson.h>
#include <cstring>

void SerialTransport::begin(unsigned long baud) {
  Serial.begin(baud);
  delay(500);
}

void SerialTransport::sendOrientation(unsigned long timestampMs, const float q[4], const float servo[2]) {
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

  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();
}

void SerialTransport::pollCommands(std::function<void(const char* cmd)> cmdHandler,
                                   std::function<void(float kp, float ki, float kd)> pidHandler) {
  if (!Serial.available()) {
    return;
  }

  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.isEmpty()) {
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, line)) {
    return;
  }

  const char* cmd = doc["cmd"];
  if (cmd == nullptr) {
    return;
  }
  if (strcmp(cmd, "pid") == 0 && pidHandler) {
    pidHandler(doc["kp"] | 0.0f, doc["ki"] | 0.0f, doc["kd"] | 0.0f);
  } else if (cmdHandler) {
    cmdHandler(cmd);
  }
}
