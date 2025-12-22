const { db } = require("../config/firebaseAdmin");

const chatAController = {
  // 1. User kirim pesan (Gunakan ID dari JWT sebagai nama folder di Firebase)
  sendMessageFromUser: async (req, res) => {
    const userId = req.user.id;
    const { text } = req.body;
    const userName = req.user.name || "Pelanggan"; // Fallback jika name kosong
    const now = new Date().toISOString();

    try {
      await db.ref(`chata/${userId}/messages`).push({
        sender: "user",
        text,
        timestamp: now,
      });

      await db.ref(`chata/${userId}/meta`).transaction((current) => {
        return {
          ...current,
          lastMessage: text,
          updatedAt: now,
          userName: userName,
          unreadCount: (current?.unreadCount || 0) + 1,
        };
      });

      res.status(200).json({ success: true, message: "Pesan terkirim" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Admin balas pesan (Menggunakan field 'message' sesuai Action frontend)
  replyFromAdmin: async (req, res) => {
    const { targetUserId, message } = req.body;
    const now = new Date().toISOString();

    if (!message) return res.status(400).json({ message: "Pesan kosong" });

    try {
      // Masukkan ke folder user yang dituju
      await db.ref(`chata/${targetUserId}/messages`).push({
        sender: "admin",
        text: message,
        timestamp: now,
      });

      // Update meta tanpa menambah unread (karena ini balasan admin)
      await db.ref(`chata/${targetUserId}/meta`).update({
        lastMessage: message,
        updatedAt: now,
      });

      res.status(200).json({ success: true, message: "Balasan terkirim" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Reset Notifikasi (Dipanggil otomatis saat admin klik chat)
  resetUnread: async (req, res) => {
    const { targetUserId } = req.body;

    try {
      await db.ref(`chata/${targetUserId}/meta`).update({
        unreadCount: 0,
      });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },
};

module.exports = chatAController;
