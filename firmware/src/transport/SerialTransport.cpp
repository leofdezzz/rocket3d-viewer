#include "SerialTransport.h"

#include <ArduinoJson.h>

void SerialTransport::begin(unsigned long baud) {
  Serial.begin(baud);
  delay(500);
}

void SerialTransport::sendOrientation(unsigned long timestampMs, const float q[4]) {
  JsonDocument doc;
  doc["t"] = timestampMs;
  JsonArray quat = doc["q"].to<JsonArray>();
  quat.add(q[0]);
  quat.add(q[1]);
  quat.add(q[2]);
  quat.add(q[3]);

  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();
}

void SerialTransport::pollCommands(std::function<void(const char* cmd)> handler) {
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
  if (cmd != nullptr) {
    handler(cmd);
  }
}
