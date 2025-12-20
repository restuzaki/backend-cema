const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const calculatorController = require("../controllers/calculatorController");

// Settings (Singleton)
router.get("/settings", calculatorController.getSettings);
router.put(
  "/settings",
  authMiddleware,
  checkPermission("calculator_settings", "update"),
  calculatorController.updateSettings
);

module.exports = router;
