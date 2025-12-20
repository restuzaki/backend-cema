const CalculatorSettings = require("../models/calculatorSettings");

// --- SETTINGS ---
exports.getSettings = async (req, res) => {
  try {
    // Singleton pattern
    let settings = await CalculatorSettings.findOne();
    if (!settings) {
      // Auto-create default if not exists
      settings = await CalculatorSettings.create({
        id: "CALC-SETTINGS",
        areaMultiplier: 1,
        pricePerRoom: 0,
      });
    }
    res.json({ status: "success", data: settings });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "error", error: "Failed to fetch settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await CalculatorSettings.findOne();
    if (!settings) {
      settings = await CalculatorSettings.create({
        id: "CALC-SETTINGS",
        areaMultiplier: 1,
        pricePerRoom: 0,
      });
    }

    const { areaMultiplier, pricePerRoom } = req.body;
    if (areaMultiplier !== undefined) settings.areaMultiplier = areaMultiplier;
    if (pricePerRoom !== undefined) settings.pricePerRoom = pricePerRoom;

    await settings.save();
    res.json({ status: "success", data: settings });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to update settings" });
  }
};
