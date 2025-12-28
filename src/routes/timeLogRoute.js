const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const validate = require("../middleware/validateRequest");
const {
  createTimeLogSchema,
  updateTimeLogSchema,
} = require("../validations/timeLog.validation");
const timeLogController = require("../controllers/timeLogController");

// Create time log
router.post(
  "/time-logs",
  authMiddleware,
  checkPermission("time_logs", "create"),
  validate(createTimeLogSchema),
  timeLogController.createTimeLog
);

// Get time log by ID
router.get(
  "/time-logs/:id",
  authMiddleware,
  checkPermission("time_logs", "view"),
  timeLogController.getTimeLogById
);

// Get all time logs (with role-based filtering in service layer)
router.get(
  "/time-logs",
  authMiddleware,
  checkPermission("time_logs", "view"),
  timeLogController.getAllTimeLogs
);

// Update time log (includes status updates)
router.put(
  "/time-logs/:id",
  authMiddleware,
  checkPermission("time_logs", "update"),
  validate(updateTimeLogSchema),
  timeLogController.updateTimeLog
);

module.exports = router;
