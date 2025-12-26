const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const scheduleController = require("../controllers/scheduleController");

router.get(
  "/schedules",
  authMiddleware,
  checkPermission("schedules", "view"),
  scheduleController.getAllSchedules
);

router.get(
  "/schedules/:id",
  authMiddleware,
  checkPermission("schedules", "view"),
  scheduleController.getScheduleById
);

router.post(
  "/schedules",
  authMiddleware,
  checkPermission("schedules", "create"),
  scheduleController.createSchedule
);

router.put(
  "/schedules/:id",
  authMiddleware,
  checkPermission("schedules", "update"),
  scheduleController.updateSchedule
);

router.delete(
  "/schedules/:id",
  authMiddleware,
  checkPermission("schedules", "delete"),
  scheduleController.deleteSchedule
);

module.exports = router;
