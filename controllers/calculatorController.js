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
        materials: {
          standard: 0,
          premium: 0,
          luxury: 0,
        },
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
        materials: {
          standard: 0,
          premium: 0,
          luxury: 0,
        },
      });
    }

    const { areaMultiplier, pricePerRoom, materials } = req.body;
    if (areaMultiplier !== undefined) settings.areaMultiplier = areaMultiplier;
    if (pricePerRoom !== undefined) settings.pricePerRoom = pricePerRoom;
    if (materials !== undefined) {
      if (materials.standard !== undefined)
        settings.materials.standard = materials.standard;
      if (materials.premium !== undefined)
        settings.materials.premium = materials.premium;
      if (materials.luxury !== undefined)
        settings.materials.luxury = materials.luxury;
    }

    await settings.save();
    res.json({ status: "success", data: settings });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to update settings" });
  }
};
