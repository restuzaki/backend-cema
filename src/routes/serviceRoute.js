const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");

router.get(
  "/services",
  authMiddleware,
  checkPermission("services", "view"),
  serviceController.getAllServices
);
router.get("/services/shown", serviceController.getShownServices);
router.post(
  "/services",
  authMiddleware,
  checkPermission("services", "create"),
  serviceController.createService
);
router.put(
  "/services/:id",
  authMiddleware,
  checkPermission("services", "update"),
  serviceController.updateService
);
router.delete(
  "/services/:id",
  authMiddleware,
  checkPermission("services", "delete"),
  serviceController.deleteService
);

module.exports = router;
