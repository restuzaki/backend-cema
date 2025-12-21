const express = require("express");
const router = express.Router();

const portfolioController = require("../controllers/portfolioController");
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");

//get Portfolio
router.get(
  "/portfolio",
  authMiddleware,
  checkPermission("portfolios", "view"),
  portfolioController.getAllPortfolio
);

// get shown Portfolio
router.get("/portfolio/shown", portfolioController.getShownPortfolio);

//get Portfolio by id
router.get(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "view"),
  portfolioController.getPortfolioById
);
//create Portfolio
router.post(
  "/portfolio",
  authMiddleware,
  checkPermission("portfolios", "create"),
  portfolioController.createPortfolio
);
//update Portfolio
router.put(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "update"),
  portfolioController.updatePortfolio
);
//delete Portfolio
router.delete(
  "/portfolio/:id",
  authMiddleware,
  checkPermission("portfolios", "delete"),
  portfolioController.deletePortfolio
);

module.exports = router;
