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
    });
    console.log(`✅ Admin created -> email: ${adminEmail}  password: ${adminPassword}`);
  } else {
    console.log("ℹ️ Admin already exists:", adminEmail);
  }

  // --- Demo parking slots (30 total: A1-A7, B1-B7, C1-C6, D1-D4, E1-E6) ---
  const desiredSlots = [];
  const zoneCounts = { A: 7, B: 7, C: 6, D: 4, E: 6 };
  Object.entries(zoneCounts).forEach(([zone, count]) => {
    for (let i = 1; i <= count; i++) {
      desiredSlots.push({
        slotNumber: `${zone}${i}`,
        zone,
        nearestGate: zone === "A" ? "Main Gate" : zone === "B" ? "East Gate" : zone === "C" ? "West Gate" : "North Gate",
        chargingAvailable: i % 4 === 0,
        covered: i % 3 === 0,
        category: i === 1 ? "disabled" : i % 5 === 0 ? "ev" : "general",
        status: "available",
      });
    }
  });

  const existingSlotNumbers = new Set(
    (await ParkingSlot.find({}, { slotNumber: 1 })).map((slot) => slot.slotNumber)
  );
  const missingSlots = desiredSlots.filter((slot) => !existingSlotNumbers.has(slot.slotNumber));
  if (missingSlots.length > 0) {
    await ParkingSlot.insertMany(missingSlots);
    console.log(`✅ ${missingSlots.length} missing demo parking slot(s) created`);
  } else {
    console.log("ℹ️ All 30 demo parking slots already exist");
  }

  console.log("🌱 Seeding complete");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
