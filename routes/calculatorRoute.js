const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const calculatorController = require("../controllers/calculatorController");

// Materials
router.get("/materials", calculatorController.getAllMaterials);
router.get(
  "/materials/:id",
  authMiddleware,
  checkPermission("materials", "view"),
  calculatorController.getMaterialById
);
router.post(
  "/materials",
  authMiddleware,
  checkPermission("materials", "create"),
  calculatorController.createMaterial
);
router.put(
  "/materials/:id",
  authMiddleware,
  checkPermission("materials", "update"),
  calculatorController.updateMaterial
);
router.delete(
  "/materials/:id",
  authMiddleware,
  checkPermission("materials", "delete"),
  calculatorController.deleteMaterial
);

// Settings (Singleton)
router.get("/calculator/settings", calculatorController.getSettings);
router.put(
  "/calculator/settings",
  authMiddleware,
  checkPermission("calculator_settings", "update"),
  calculatorController.updateSettings
);

module.exports = router;
