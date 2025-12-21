const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);
router.post("/refresh-token", authMiddleware, authController.refreshToken);

module.exports = router;
