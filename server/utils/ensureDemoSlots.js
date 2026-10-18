const ParkingSlot = require("../models/ParkingSlot");

const ensureDemoSlots = async () => {
  const desiredSlots = [
    {
      slotNumber: "A1",
      zone: "A",
      nearestGate: "Main Gate",
      category: "disabled",
      status: "available",
    },
    {
      slotNumber: "A2",
      zone: "A",
      nearestGate: "Main Gate",
      category: "general",
      status: "available",
    },
    {
      slotNumber: "A3",
      zone: "A",
      nearestGate: "Main Gate",
      covered: true,
      category: "general",
      status: "available",
    },
    {
      slotNumber: "A4",
      zone: "A",
      nearestGate: "Main Gate",
      chargingAvailable: true,
      category: "general",
      status: "available",
    },
  ];
  const removedDemoSlots = [
    "A5", "A6", "A7",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7",
    "C1", "C2", "C3", "C4", "C5", "C6",
    "D1", "D2", "D3", "D4",
    "E1", "E2", "E3", "E4", "E5", "E6",
  ];

  const removed = await ParkingSlot.deleteMany({ slotNumber: { $in: removedDemoSlots } });
  if (removed.deletedCount > 0) {
    console.log(`Removed ${removed.deletedCount} demo parking slot(s)`);
  }

  const existingSlotNumbers = new Set(
    (await ParkingSlot.find({}, { slotNumber: 1 })).map((slot) => slot.slotNumber)
  );
  const missingSlots = desiredSlots.filter((slot) => !existingSlotNumbers.has(slot.slotNumber));

  if (missingSlots.length > 0) {
    await ParkingSlot.insertMany(missingSlots);
    console.log(`✅ ${missingSlots.length} missing demo parking slot(s) created`);
  }
};

module.exports = ensureDemoSlots;
