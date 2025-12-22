const express = require("express");
const router = express.Router();

// Import Middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import Controller
const chatAController = require("../controllers/chatController");

/**
 * Middleware Internal: Cek Role Admin
 * Memastikan hanya user dengan role 'admin' yang bisa mengakses route ini
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// --- ROUTES ---

// 1. Admin membalas pesan (Harus Login & Role Admin)
router.post(
  "/reply",
  authMiddleware,
  adminOnly,
  chatAController.replyFromAdmin
);

// 2. Reset status unread (Harus Login & Role Admin)
router.patch(
  "/reset-unread",
  authMiddleware,
  adminOnly,
  chatAController.resetUnread
);

// 3. User mengirim pesan (Hanya butuh Login)
router.post("/send", authMiddleware, chatAController.sendMessageFromUser);

module.exports = router;
