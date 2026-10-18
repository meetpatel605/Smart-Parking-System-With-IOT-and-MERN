require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const IRStatus = require("./models/IRStatus");
const connectDB = require("./config/db");
const ensureDemoSlots = require("./utils/ensureDemoSlots");
const { initMqtt } = require("./services/mqtt");

const authRoutes = require("./routes/auth");
const slotRoutes = require("./routes/slots");
const bookingRoutes = require("./routes/bookings");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const hardwareRoutes = require("./routes/hardware");

const app = express();
const httpServer = http.createServer(app);
const socketIo = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

socketIo.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id isBlocked");
    if (!user || user.isBlocked) return next(new Error("Authentication failed"));
    socket.userId = user._id.toString();
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

app.use("/api", limiter);

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    message: "Smart Parking API running",
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Parking Management System API is running 🚗",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hardware", hardwareRoutes);

/* Receive IR sensor data from ESP32.
   Supports one or multiple slots per physical device. */
app.post("/api/iot/ir-status", async (req, res) => {
  try {
    const { deviceId, slotId = "A1", detected } = req.body || {};

    if (typeof deviceId !== "string" || !deviceId.trim() ||
        typeof slotId !== "string" || !/^[A-Z][0-9]{1,2}$/i.test(slotId) ||
        typeof detected !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Valid deviceId, slotId (for example A1), and boolean detected are required",
      });
    }

    const physicalDeviceId = deviceId.trim();
    const normalizedSlotId = slotId.trim().toUpperCase();

    // Keep a unique record per device + slot. The composite stored deviceId
    // also remains compatible with older MongoDB databases that have a unique
    // index on IRStatus.deviceId.
    const sensorKey = `${physicalDeviceId}-${normalizedSlotId}`;
    const status = await IRStatus.findOneAndUpdate(
      { deviceId: sensorKey },
      {
        $set: {
          deviceId: sensorKey,
          parentDeviceId: physicalDeviceId,
          slotId: normalizedSlotId,
          detected,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Keep the actual parking slot in sync when that slot exists.
    const ParkingSlot = require("./models/ParkingSlot");
    const slot = await ParkingSlot.findOneAndUpdate(
      { slotNumber: normalizedSlotId },
      { status: detected ? "occupied" : "available" },
      { new: true }
    );

    const payload = { ...status.toObject(), parkingSlot: slot || null };
    socketIo.emit("ir:status", payload);
    if (slot) socketIo.emit("slot:status", slot);

    return res.status(200).json({
      success: true,
      message: "IR status saved",
      data: payload,
    });
  } catch (error) {
    console.error("IR status save error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save IR status",
    });
  }
});

/* Get one device's latest status, or all slots belonging to that device.
   Optional ?slotId=A1 filters to a single slot. */
app.get("/api/iot/ir-status/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const query = {
      $or: [
        { parentDeviceId: deviceId },
        { deviceId },
      ],
    };
    if (req.query.slotId) {
      query.slotId = String(req.query.slotId).trim().toUpperCase();
    }

    const statuses = await IRStatus.find(query).sort({ slotId: 1 }).lean();

    if (!statuses.length) {
      return res.status(404).json({
        success: false,
        message: "No status found for this device",
      });
    }

    // Preserve the old single-status response when slotId is explicitly requested.
    if (req.query.slotId) {
      return res.status(200).json({ success: true, data: statuses[0] });
    }

    return res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    console.error("IR status fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch IR status",
    });
  }
});

/* RFID access check used by the ESP32.
   Access is granted only when the existing booking/credential rules approve it. */
app.post("/api/iot/rfid-scan", async (req, res) => {
  try {
    const crypto = require("crypto");
    const AccessEvent = require("./models/AccessEvent");
    const { authorizeAccess, normalize } = require("./services/accessAuthorization");
    const { deviceId, uid, gate = "entry" } = req.body || {};

    if (typeof deviceId !== "string" || !deviceId.trim() ||
        typeof uid !== "string" || !uid.trim()) {
      return res.status(400).json({
        success: false,
        authorized: false,
        message: "Valid deviceId and uid are required",
      });
    }

    const identifier = normalize(uid);
    const occurredAt = new Date();
    const authorization = await authorizeAccess({
      eventType: "rfid",
      identifier,
      occurredAt,
    });

    const eventId = crypto.randomUUID();
    await AccessEvent.create({
      eventId,
      deviceId: deviceId.trim(),
      gate: String(gate).trim() || "entry",
      eventType: "rfid",
      identifier,
      user: authorization.user?._id || null,
      booking: authorization.booking?._id || null,
      vehicleNumber: authorization.vehicleNumber || "",
      status: authorization.granted ? "granted" : "denied",
      reason: authorization.reason,
      commandStatus: "not_required",
      occurredAt,
      rawPayload: { deviceId: deviceId.trim(), uid: identifier },
    });

    socketIo.emit("access:event", {
      eventId,
      deviceId: deviceId.trim(),
      gate,
      eventType: "rfid",
      identifier,
      status: authorization.granted ? "granted" : "denied",
      reason: authorization.reason,
      occurredAt,
    });

    return res.status(200).json({
      success: true,
      authorized: Boolean(authorization.granted),
      message: authorization.granted ? "Access granted" : "Access denied",
      reason: authorization.reason,
    });
  } catch (error) {
    console.error("RFID authorization error:", error.message);
    return res.status(500).json({
      success: false,
      authorized: false,
      message: "Unable to authorize RFID card",
    });
  }
});

// 404 handler
app.use((req, res) =>
  res.status(404).json({ message: "Route not found" })
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong on the server",
  });
});

const PORT = process.env.PORT || 5252;

connectDB()
  .then(ensureDemoSlots)
  .then(() => initMqtt({ socketIo }))
  .then(() => {
    httpServer.listen(PORT, "0.0.0.0", () => {
      if (process.env.NODE_ENV === "production") {
        console.log(`Server running on port ${PORT}`);
      } else {
        console.log(`Server running at http://localhost:${PORT}`);
      }
    });
  })
  .catch((err) => {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  });