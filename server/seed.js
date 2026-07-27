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

  // --- Demo parking slots ---
  const existingCount = await ParkingSlot.countDocuments();
  if (existingCount === 0) {
    const zones = ["A", "B", "C"];
    const slots = [];
    zones.forEach((zone) => {
      for (let i = 1; i <= 6; i++) {
        slots.push({
          slotNumber: `${zone}${i}`,
          zone,
          nearestGate: zone === "A" ? "Main Gate" : zone === "B" ? "East Gate" : "West Gate",
          chargingAvailable: i % 4 === 0,
          covered: i % 3 === 0,
          category: i === 1 ? "disabled" : i % 5 === 0 ? "ev" : "general",
          status: "available",
        });
      }
    });
    await ParkingSlot.insertMany(slots);
    console.log(`✅ ${slots.length} demo parking slots created`);
  } else {
    console.log("ℹ️ Parking slots already exist, skipping seed");
  }

  console.log("🌱 Seeding complete");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
