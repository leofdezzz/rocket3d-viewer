#include "I2cScan.h"

#include <ArduinoJson.h>

void initI2CBus(int sda, int scl) {
  Wire.begin(sda, scl);
  Wire.setClock(100000);
  delay(100);
}

void logI2CPins(int sda, int scl) {
  Serial.printf("{\"i2c_pins\":{\"sda\":%d,\"scl\":%d}}\n", sda, scl);
  Serial.flush();
}

void scanI2CBus() {
  JsonDocument doc;
  JsonArray devices = doc["i2c"].to<JsonArray>();

  for (uint8_t address = 1; address < 127; ++address) {
    Wire.beginTransmission(address);
    const uint8_t error = Wire.endTransmission();
    if (error == 0) {
      devices.add(address);
    }
  }

  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();
}
