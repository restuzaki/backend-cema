const Material = require("../models/material");
const CalculatorSettings = require("../models/calculatorSettings");

// --- MATERIALS ---
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.json({ status: "success", data: materials });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to fetch materials" });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findOne({ id: req.params.id });
    if (!material)
      return res
        .status(404)
        .json({ status: "error", error: "Material not found" });
    res.json({ status: "success", data: material });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to fetch material" });
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
    res
      .status(500)
      .json({ status: "error", error: "Failed to create material" });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ id: req.params.id });
    if (!material)
      return res
        .status(404)
        .json({ status: "error", error: "Material not found" });

    const { name, priceMultiplier } = req.body;
    if (name) material.name = name;
    if (priceMultiplier) material.priceMultiplier = priceMultiplier;

    await material.save();
    res.json({ status: "success", data: material });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to update material" });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await Material.findOneAndDelete({ id: req.params.id });
    res.json({ status: "success", message: "Material deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", error: "Failed to delete material" });
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
