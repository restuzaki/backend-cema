const Material = require("../models/material");
const CalculatorSettings = require("../models/calculatorSettings");

// --- MATERIALS ---
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.json({ status: "success", data: materials });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to fetch materials" });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findOne({ id: req.params.id });
    if (!material) return res.status(404).json({ status: "error", error: "Material not found" });
    res.json({ status: "success", data: material });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to fetch material" });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const { name, priceMultiplier, id } = req.body;
    const newMaterial = await Material.create({
      id: id || `MAT-${Date.now()}`,
      name,
      priceMultiplier,
    });
    res.status(201).json({ status: "success", data: newMaterial });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to create material" });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ id: req.params.id });
    if (!material) return res.status(404).json({ status: "error", error: "Material not found" });

    const { name, priceMultiplier } = req.body;
    if (name) material.name = name;
    if (priceMultiplier) material.priceMultiplier = priceMultiplier;

    await material.save();
    res.json({ status: "success", data: material });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to update material" });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await Material.findOneAndDelete({ id: req.params.id });
    res.json({ status: "success", message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to delete material" });
  }
};

// --- SETTINGS ---
exports.getSettings = async (req, res) => {
  try {
    // Singleton pattern
    let settings = await CalculatorSettings.findOne();
    if (!settings) {
       // Auto-create default if not exists
       settings = await CalculatorSettings.create({
         id: "CALC-SETTINGS",
         basePrice: 0,
         areaMultiplier: 1,
         floorMultiplier: 1
       });
    }
    res.json({ status: "success", data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", error: "Failed to fetch settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await CalculatorSettings.findOne();
     if (!settings) {
       settings = await CalculatorSettings.create({
         id: "CALC-SETTINGS",
         basePrice: 0,
         areaMultiplier: 1,
         floorMultiplier: 1
       });
    }

    const { basePrice, areaMultiplier, floorMultiplier } = req.body;
    if (basePrice !== undefined) settings.basePrice = basePrice;
    if (areaMultiplier !== undefined) settings.areaMultiplier = areaMultiplier;
    if (floorMultiplier !== undefined) settings.floorMultiplier = floorMultiplier;

    await settings.save();
    res.json({ status: "success", data: settings });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to update settings" });
  }
};
