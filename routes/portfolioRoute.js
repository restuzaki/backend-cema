const express = require("express");
const router = express.Router();

const portfolioController = require("../controllers/portofolioController");

router.get("/portfolio", portfolioController.getAllPortfolio);
router.get("/portfolio/:id", portfolioController.getPortfolioById);
router.post("/portfolio", upload.single("photoUrl"), portfolioController.createPortfolio);
router.put("/portfolio/:id", upload.single("photoUrl"), portfolioController.updatePortfolio);
router.delete("/portfolio/:id", portfolioController.deletePortfolio);

module.exports = router;
