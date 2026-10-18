const ParkingSlot = require("../models/ParkingSlot");

const ensureDemoSlots = async () => {
  const desiredSlots = [];
  const zoneCounts = { A: 7, B: 7, C: 6, D: 4, E: 6 };

  Object.entries(zoneCounts).forEach(([zone, count]) => {
    for (let i = 1; i <= count; i++) {
      desiredSlots.push({
        slotNumber: `${zone}${i}`,
        zone,
        nearestGate:
          zone === "A"
            ? "Main Gate"
            : zone === "B"
              ? "East Gate"
              : zone === "C"
                ? "West Gate"
                : "North Gate",
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
  }
};

module.exports = ensureDemoSlots;
