const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");

const ensureDemoSlots = async () => {
  const desiredSlots = [];
  const zoneCounts = { A: 4 };

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

  const removableSlotNumbers = [...existingSlotNumbers].filter(
    (slotNumber) => !desiredSlots.some((slot) => slot.slotNumber === slotNumber)
  );
  if (removableSlotNumbers.length > 0) {
    const bookedSlots = await Booking.distinct("slot", {
      slot: { $in: (await ParkingSlot.find({ slotNumber: { $in: removableSlotNumbers } }, { _id: 1 })).map((slot) => slot._id) },
    });
    const bookedSlotIds = new Set(bookedSlots.map((id) => id.toString()));
    const removableSlots = await ParkingSlot.find({
      slotNumber: { $in: removableSlotNumbers },
      _id: { $nin: [...bookedSlotIds] },
    }, { _id: 1 });
    if (removableSlots.length > 0) {
      await ParkingSlot.deleteMany({ _id: { $in: removableSlots.map((slot) => slot._id) } });
      console.log(`✅ ${removableSlots.length} extra demo parking slot(s) removed`);
    }
  }
};

module.exports = ensureDemoSlots;
