require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const ParkingSlot = require("./models/ParkingSlot");

const run = async () => {
  await connectDB();

  // --- Admin account ---
  const adminEmail = process.env.ADMIN_EMAIL || "admin@smartparking.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      fullName: "System Admin",
      email: adminEmail,
      mobile: "9999999999",
      password: adminPassword,
      userType: "admin",
      emailVerified: true,
    });
    console.log(`Admin created -> email: ${adminEmail}  password: ${adminPassword}`);
  } else {
    console.log("ℹAdmin already exists:", adminEmail);
  }

  // --- Demo parking slots (4 total: A1-A4) ---
  const desiredSlots = [
    { slotNumber: "A1", zone: "A", nearestGate: "Main Gate", category: "disabled", status: "available" },
    { slotNumber: "A2", zone: "A", nearestGate: "Main Gate", category: "general", status: "available" },
    { slotNumber: "A3", zone: "A", nearestGate: "Main Gate", covered: true, category: "general", status: "available" },
    { slotNumber: "A4", zone: "A", nearestGate: "Main Gate", chargingAvailable: true, category: "general", status: "available" },
  ];
  const removedDemoSlots = [
    "A5", "A6", "A7",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7",
    "C1", "C2", "C3", "C4", "C5", "C6",
    "D1", "D2", "D3", "D4",
    "E1", "E2", "E3", "E4", "E5", "E6",
  ];
  await ParkingSlot.deleteMany({ slotNumber: { $in: removedDemoSlots } });

  const existingSlotNumbers = new Set(
    (await ParkingSlot.find({}, { slotNumber: 1 })).map((slot) => slot.slotNumber)
  );
  const missingSlots = desiredSlots.filter((slot) => !existingSlotNumbers.has(slot.slotNumber));
  if (missingSlots.length > 0) {
    await ParkingSlot.insertMany(missingSlots);
    console.log(`✅ ${missingSlots.length} missing demo parking slot(s) created`);
  } else {
    console.log("ℹ️ All 4 demo parking slots already exist");
  }

  console.log("🌱 Seeding complete");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
