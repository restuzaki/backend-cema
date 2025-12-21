const express = require("express");
const router = express.Router();

const portfolioController = require("../controllers/portfolioController");
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");

// PERBAIKAN: Import langsung dari middleware upload
const upload = require("../middleware/uploadMiddleware");

router.get(
  "/portfolio",
  authMiddleware,
  checkPermission("portfolios", "view"),
  portfolioController.getAllPortfolio
);

router.get("/portfolio/shown", portfolioController.getShownPortfolio);

router.get(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "view"),
  portfolioController.getPortfolioById
);

router.post(
  "/portfolio",
  authMiddleware,
  checkPermission("portfolios", "create"),
  upload.single("photo"), // Sekarang upload tidak akan undefined
  portfolioController.createPortfolio
);

router.put(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "update"),
  upload.single("photo"),
  portfolioController.updatePortfolio
);

router.delete(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "delete"),
  portfolioController.deletePortfolio
);

module.exports = router;
