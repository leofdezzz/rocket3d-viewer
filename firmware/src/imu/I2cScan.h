#pragma once

#include <Wire.h>

void initI2CBus(int sda, int scl);
void logI2CPins(int sda, int scl);
void scanI2CBus();
