/*
  Smart Parking ESP32 gate controller

  Libraries:
    PubSubClient, MFRC522, ArduinoJson, ESP32Servo
  Wiring (example):
    MFRC522 SS=5, RST=22, SPI=SCK 18/MISO 19/MOSI 23
    Gate servo signal=13

  Store Wi-Fi and MQTT credentials securely before flashing. Use a per-device
  MQTT username/password and TLS certificate in production.
*/

#include <ArduinoJson.h>
#include <MFRC522.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP32Servo.h>
#include <time.h>

// Install these libraries before compiling:
// PubSubClient, MFRC522, ArduinoJson, and ESP32Servo.

// Development broker only. Use a private TLS broker for production.
const bool MQTT_USE_TLS = false;

const char *WIFI_SSID = "REPLACE_ME";
const char *WIFI_PASSWORD = "REPLACE_ME";
const char *MQTT_HOST = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char *MQTT_USERNAME = "";
const char *MQTT_PASSWORD = "";
const char *DEVICE_ID = "ESP32-01";
const char *MQTT_ROOT_CA = R"EOF(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_BROKER_ROOT_CA
-----END CERTIFICATE-----
)EOF";

const int RFID_SS_PIN = 5;
const int RFID_RST_PIN = 27;
const int IR1_PIN = 32;
const int IR2_PIN = 33;
const bool IR_SENSOR_ACTIVE_LOW = true;
const int SERVO_PIN = 13;
const int CLOSED_ANGLE = 0;
const int OPEN_ANGLE = 90;
const unsigned long HEARTBEAT_INTERVAL_MS = 30000;
const unsigned long GATE_OPEN_MS = 5000;

WiFiClientSecure tlsClient;
WiFiClient plainClient;
PubSubClient mqtt(tlsClient);
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Servo gateServo;
unsigned long lastHeartbeat = 0;
bool hasIrState1 = false;
bool lastIrDetected1 = false;
bool hasIrState2 = false;
bool lastIrDetected2 = false;

String isoTimestamp();
void publishSlotStatus(const char *slotId, bool detected);

String baseTopic(const char *suffix) {
  return String("parking/") + suffix;
}

#if ARDUINOJSON_VERSION_MAJOR >= 7
#define JSON_DOCUMENT(name, capacity) JsonDocument name
#else
#define JSON_DOCUMENT(name, capacity) StaticJsonDocument<capacity> name
#endif

template <typename DocumentType>
void publishJson(const String &topic, DocumentType &document) {
  char buffer[512];
  size_t length = serializeJson(document, buffer, sizeof(buffer));
  if (length == 0 || length >= sizeof(buffer)) {
    Serial.println("MQTT payload is empty or too large");
    return;
  }
  if (!mqtt.publish(topic.c_str(), reinterpret_cast<const uint8_t *>(buffer), length, true)) {
    Serial.println("MQTT publish failed");
  }
}

void publishGateStatus(const char *status, const char *commandId = "") {
  JSON_DOCUMENT(document, 256);
  document["deviceId"] = DEVICE_ID;
  document["status"] = status;
  if (commandId[0] != '\0') document["commandId"] = commandId;
  document["timestamp"] = isoTimestamp();
  publishJson(baseTopic("gate/entry/status"), document);
}

void openGate(const char *commandId) {
  gateServo.write(OPEN_ANGLE);
  publishGateStatus("open", commandId);
  delay(GATE_OPEN_MS);
  gateServo.write(CLOSED_ANGLE);
  publishGateStatus("closed", commandId);
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  if (String(topic) != baseTopic("gate/entry/command")) return;

  JSON_DOCUMENT(document, 256);
  if (deserializeJson(document, payload, length)) return;
  const char *command = document["command"] | "";
  const char *commandId = document["commandId"] | "";
  if (strcmp(command, "open") == 0) openGate(commandId);
  else if (strcmp(command, "deny") == 0) publishGateStatus("denied", commandId);
  else if (strcmp(command, "close") == 0) {
    gateServo.write(CLOSED_ANGLE);
    publishGateStatus("closed", commandId);
  }
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 30000) {
    delay(500);
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi connection timed out; retrying in loop");
  }
}

void connectMqtt() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqtt.connected()) {
    String clientId = String(DEVICE_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      String commandTopic = baseTopic("gate/entry/command");
      mqtt.subscribe(commandTopic.c_str(), 1);
      publishGateStatus("connected");
      hasIrState1 = false;
      hasIrState2 = false;
    } else {
      Serial.print("MQTT connection failed, state=");
      Serial.println(mqtt.state());
      delay(5000);
    }
  }
}

void publishHeartbeat() {
  JSON_DOCUMENT(document, 256);
  document["deviceId"] = DEVICE_ID;
  document["firmware"] = "1.0.0";
  document["ip"] = WiFi.localIP().toString();
  document["rssi"] = WiFi.RSSI();
  publishJson(baseTopic("devices/") + DEVICE_ID + "/heartbeat", document);
}

String isoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 100)) return "";
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

void publishRfidScan() {
  String cardId;
  for (byte index = 0; index < rfid.uid.size; index++) {
    if (rfid.uid.uidByte[index] < 0x10) cardId += "0";
    cardId += String(rfid.uid.uidByte[index], HEX);
  }
  cardId.toUpperCase();

  JSON_DOCUMENT(document, 256);
  document["eventId"] = String(DEVICE_ID) + "-" + String(millis());
  document["deviceId"] = DEVICE_ID;
  document["rfidCardId"] = cardId;
  document["timestamp"] = isoTimestamp();
  publishJson(baseTopic("gate/entry/rfid"), document);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void publishSlotStatus(const char *slotId, bool detected) {
  JSON_DOCUMENT(document, 256);
  document["deviceId"] = DEVICE_ID;
  document["slotId"] = slotId;
  document["detected"] = detected;
  document["status"] = detected ? "occupied" : "available";
  document["timestamp"] = isoTimestamp();
  publishJson(baseTopic("slots/") + slotId + "/status", document);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("Smart Parking ESP32 gate controller starting");
  if (String(WIFI_SSID) == "REPLACE_ME" || String(MQTT_HOST) == "REPLACE_ME") {
    Serial.println("ERROR: Set Wi-Fi and MQTT credentials before flashing");
  }
  SPI.begin();
  rfid.PCD_Init();
  pinMode(IR1_PIN, INPUT_PULLUP);
  pinMode(IR2_PIN, INPUT_PULLUP);
  gateServo.attach(SERVO_PIN);
  gateServo.write(CLOSED_ANGLE);
  connectWifi();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  if (MQTT_USE_TLS) {
    tlsClient.setCACert(MQTT_ROOT_CA);
    mqtt.setClient(tlsClient);
  } else {
    mqtt.setClient(plainClient);
  }
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    publishHeartbeat();
  }
  if (mqtt.connected()) {
    const bool detected1 = digitalRead(IR1_PIN) == (IR_SENSOR_ACTIVE_LOW ? LOW : HIGH);
    if (!hasIrState1 || detected1 != lastIrDetected1) {
      lastIrDetected1 = detected1;
      hasIrState1 = true;
      publishSlotStatus("A1", detected1);
    }

    const bool detected2 = digitalRead(IR2_PIN) == (IR_SENSOR_ACTIVE_LOW ? LOW : HIGH);
    if (!hasIrState2 || detected2 != lastIrDetected2) {
      lastIrDetected2 = detected2;
      hasIrState2 = true;
      publishSlotStatus("A2", detected2);
    }
  }
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) publishRfidScan();
}
