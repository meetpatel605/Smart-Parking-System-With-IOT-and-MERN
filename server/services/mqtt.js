const crypto = require("crypto");
const mqtt = require("mqtt");
const Device = require("../models/Device");
const ParkingSlot = require("../models/ParkingSlot");
const AccessEvent = require("../models/AccessEvent");
const IRStatus = require("../models/IRStatus");
const { authorizeAccess, normalize } = require("./accessAuthorization");

const TOPICS = {
  entryCredential: "parking/gate/entry/+",
  exitCredential: "parking/gate/exit/+",
  gateStatus: "parking/gate/+/status",
  heartbeat: "parking/devices/+/heartbeat",
  slotStatus: "parking/slots/+/status",
  irStatus: "parking/devices/+/ir-status",
};

let client = null;
let io = null;

const emit = (name, payload) => {
  if (io) io.emit(name, payload);
};

const deviceTypeFor = (deviceId) => (deviceId.toLowerCase().includes("gate") ? "gate" : "unknown");

const upsertDevice = async (deviceId, patch = {}) => {
  const now = new Date();
  const device = await Device.findOneAndUpdate(
    { deviceId },
    { $set: { ...patch, lastSeenAt: now, status: "online" }, $setOnInsert: { deviceId, type: deviceTypeFor(deviceId) } },
    { new: true, upsert: true }
  );
  emit("device:status", device);
  return device;
};

const publish = (topic, payload) => {
  if (!client || !client.connected) throw new Error("MQTT broker is not connected");
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
};

const handleCredential = async (topic, rawPayload) => {
  let payload;
  try {
    payload = JSON.parse(rawPayload.toString());
  } catch {
    payload = { identifier: rawPayload.toString() };
  }

  const [, , gate, eventType] = topic.split("/");
  const rawIdentifier = payload.identifier || payload.rfidCardId || payload.qrToken || payload.token;
  const identifier = eventType === "qr" ? String(rawIdentifier || "").trim() : normalize(rawIdentifier);
  const parsedOccurredAt = payload.timestamp ? new Date(payload.timestamp) : new Date();
  const occurredAt = Number.isNaN(parsedOccurredAt.getTime()) ? new Date() : parsedOccurredAt;
  const deviceId = String(payload.deviceId || `${gate}-reader`);
  const eventId = String(payload.eventId || crypto.createHash("sha256").update(`${deviceId}:${topic}:${identifier}:${rawPayload.toString()}`).digest("hex"));
  await upsertDevice(deviceId, { type: "rfid_reader" });

  const existing = await AccessEvent.findOne({ eventId });
  if (existing) return existing;

  const authorization = await authorizeAccess({ eventType, identifier, occurredAt });
  const commandId = crypto.randomUUID();
  const event = await AccessEvent.create({
    eventId,
    deviceId,
    gate,
    eventType,
    identifier,
    user: authorization.user?._id || null,
    booking: authorization.booking?._id || null,
    vehicleNumber: authorization.vehicleNumber || "",
    status: authorization.granted ? "granted" : "denied",
    reason: authorization.reason,
    commandId,
    commandStatus: authorization.granted ? "pending" : "not_required",
    occurredAt,
    rawPayload: payload,
  });

  const command = { commandId, eventId, command: authorization.granted ? "open" : "deny", reason: authorization.reason };
  try {
    publish(`parking/gate/${gate}/command`, command);
  } catch (error) {
    event.commandStatus = "failed";
    event.reason = `${event.reason}; ${error.message}`;
    await event.save();
  }
  emit("access:event", event);
  return event;
};

const handleMessage = async (topic, message) => {
  if (topic.match(/^parking\/gate\/(entry|exit)\/(rfid|qr)$/)) return handleCredential(topic, message);
  const heartbeat = topic.match(/^parking\/devices\/([^/]+)\/heartbeat$/);
  if (heartbeat) {
    let payload = {};
    try { payload = JSON.parse(message.toString()); } catch { payload = {}; }
    return upsertDevice(heartbeat[1], { metadata: payload, lastHeartbeatAt: new Date() });
  }
  const slot = topic.match(/^parking\/slots\/([^/]+)\/status$/);
  if (slot) {
    let payload;
    try { payload = JSON.parse(message.toString()); } catch { payload = { status: message.toString() }; }
    const status = ["available", "occupied", "reserved", "maintenance"].includes(payload.status) ? payload.status : null;
    if (!status) return;
    const updated = await ParkingSlot.findOneAndUpdate({ slotNumber: slot[1] }, { status }, { new: true });
    if (updated) emit("slot:status", updated);
    return updated;
  }
  const irStatus = topic.match(/^parking\/devices\/([^/]+)\/ir-status$/);
  if (irStatus) {
    let payload = {};
    try { payload = JSON.parse(message.toString()); } catch { return; }
    if (typeof payload.detected !== "boolean") return;
    const deviceId = String(payload.deviceId || irStatus[1]);
    const updated = await IRStatus.findOneAndUpdate(
      { deviceId },
      { $set: { detected: payload.detected, lastUpdated: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    emit("ir:status", updated);
    return updated;
  }
  const gateStatus = topic.match(/^parking\/gate\/([^/]+)\/status$/);
  if (gateStatus) {
    let payload = {};
    try { payload = JSON.parse(message.toString()); } catch { payload = { status: message.toString() }; }
    const device = await upsertDevice(String(payload.deviceId || `gate-${gateStatus[1]}`), { type: "gate", metadata: payload });
    if (payload.commandId) {
      const event = await AccessEvent.findOneAndUpdate({ commandId: payload.commandId }, { commandStatus: "acknowledged" }, { new: true });
      if (event) emit("access:event", event);
    }
    emit("gate:status", { gate: gateStatus[1], ...payload, deviceId: device.deviceId });
  }
};

const initMqtt = ({ socketIo }) => {
  io = socketIo;
  if (!process.env.MQTT_URL) {
    console.warn("MQTT_URL is not configured; hardware integration is disabled.");
    return;
  }
  client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: process.env.MQTT_CLIENT_ID || `smart-parking-backend-${process.pid}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    rejectUnauthorized: process.env.MQTT_TLS_REJECT_UNAUTHORIZED !== "false",
  });
  client.on("connect", () => {
    client.subscribe(Object.values(TOPICS), { qos: 1 }, (error) => {
      if (error) console.error("MQTT subscription failed:", error.message);
      else console.log("MQTT broker connected and topics subscribed");
    });
  });
  client.on("message", (topic, message) => handleMessage(topic, message).catch((error) => console.error("MQTT message processing failed:", error.message)));
  client.on("error", (error) => console.error("MQTT error:", error.message));
  client.on("close", () => console.warn("MQTT broker connection closed; retrying"));
};

const publishGateCommand = (gate, command) => publish(`parking/gate/${gate}/command`, command);

module.exports = { TOPICS, initMqtt, publishGateCommand };
