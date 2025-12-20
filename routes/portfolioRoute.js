const express = require("express");
const router = express.Router();

const portfolioController = require("../controllers/portofolioController");
const authmiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { checkpermission } = require("../policies/abacPolicies");

router.get("/portfolio", authmiddleware, checkpermission("view", "portfolio"), portfolioController.getAllPortfolio);
router.get("/portfolio/:id", authmiddleware, checkpermission("view", "portfolio"), portfolioController.getPortfolioById);
router.post("/portfolio", authmiddleware, upload.single("photoUrl"), checkpermission("create", "portfolio"), portfolioController.createPortfolio);
router.put("/portfolio/:id", authmiddleware, upload.single("photoUrl"), checkpermission("update", "portfolio"), portfolioController.updatePortfolio);
router.delete("/portfolio/:id", authmiddleware, checkpermission("delete", "portfolio"), portfolioController.deletePortfolio);

module.exports = router;
