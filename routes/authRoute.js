const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const portfolioController = require("../controllers/portofolioController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/portfolio", portfolioController.getAllPortfolio); //get ALl
router.get("/portfolio/:id", portfolioController.getPortfolioById); //get by ID

module.exports = router;
