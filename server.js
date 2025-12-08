require("dotenv").config();
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./model/User");

const app = express();

process.env.TZ = "Asia/Jakarta";
const PORT = process.env.PORT || 3000;

const serviceAccount = require("./cema-web-firebase-adminsdk-fbsvc-7db7e59049.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.database();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI tidak ditemukan");
  process.exit(1);
}
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Berhasil terkoneksi ke MongoDB Atlas"))
  .catch((err) => console.error("❌ Gagal koneksi MongoDB:", err));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

function isWorkingHours() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
}

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      status: "error",
      error: "Email dan Password harus diisi",
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ status: "error", error: "Email sudah terdaftar" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      email,
      password: hashedPassword,
      role: "user",
    });
    console.log(`User baru terdaftar: ${email}`);
    res.json({ status: "ok", message: "Registrasi berhasil" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", error: "Terjadi kesalahan server" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.json({ status: "error", error: "Email atau password salah" });
    }
    if (await bcrypt.compare(password, user.password)) {
      console.log(`User login: ${email}`);
      return res.json({
        status: "ok",
        message: "Login berhasil",
        role: user.role,
        // Tips: Sebaiknya kirim token (JWT) disini untuk keamanan nanti
      });
    }
    res.json({ status: "error", error: "Email atau password salah" });
  } catch (err) {
    console.log(err);
    res.json({ status: "error", error: "Server error" });
  }
});

console.log("Bot AI Monitoring Chat Started...");
const chatsRef = db.ref("chats");

function isRecent(timestamp) {
  if (!timestamp) return false;
  const diff = Date.now() - new Date(timestamp).getTime();
  return diff < 60000;
}

async function generateAIResponse(text) {
  try {
    const prompt = `
    Kamu adalah Customer Service untuk Cema Design. Jawab sopan Bahasa Indonesia.
    JIKA PESAN PERTAMA: Sapa user, info diluar jam kerja.
    PESAN SELANJUTNYA: Langsung jawab to the point.
    Pertanyaan user: "${text}"
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "Maaf, sistem sedang sibuk.";
  }
}

chatsRef.on("child_added", (sessionSnapshot) => {
  const sessionId = sessionSnapshot.key;
  const messagesRef = db.ref(`chats/${sessionId}/messages`);

  messagesRef.limitToLast(1).on("child_added", async (snapshot) => {
    const msg = snapshot.val();
    if (msg.sender === "user" && !isWorkingHours() && isRecent(msg.timestamp)) {
      const aiText = await generateAIResponse(msg.text);
      const now = new Date();

      await messagesRef.push({
        sender: "agent",
        text: aiText + "\n(🤖 AI Response - Diluar Jam Kerja)",
        time: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: now.toISOString(),
      });

      db.ref(`chats/${sessionId}/meta`).update({
        lastMessage: "🤖 " + aiText.substring(0, 30) + "...",
      });
    }
  });

  messagesRef.on("child_changed", async (snapshot) => {
    const msg = snapshot.val();
    const msgKey = snapshot.key;

    if (msg.sender === "user") {
      console.log(`Pesan diedit oleh user: ${msg.text}`);

      const nextMsgQuery = messagesRef
        .orderByKey()
        .startAfter(msgKey)
        .limitToFirst(1);

      try {
        const nextSnap = await nextMsgQuery.once("value");

        nextSnap.forEach(async (childSnap) => {
          const nextMsg = childSnap.val();

          if (nextMsg.sender === "agent") {
            console.log("Menghapus jawaban lama...");
            await childSnap.ref.remove();
          }
        });
      } catch (error) {
        console.error("Gagal menghapus pesan lama:", error);
      }

      if (!isWorkingHours()) {
        try {
          const newAiResponse = await generateAIResponse(msg.text);

          const now = new Date();
          await messagesRef.push({
            sender: "agent",
            text: newAiResponse + " (🤖 AI Response - Diluar Jam Kerja)",
            time: now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestamp: now.toISOString(),
          });

          db.ref(`chats/${sessionId}/meta`).update({
            lastMessage: "🤖 " + newAiResponse.substring(0, 30) + "...",
          });

          console.log("Jawaban AI diperbarui.");
        } catch (error) {
          console.error("Error generating new AI response:", error);
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server berjalan di http://localhost:${PORT}`);
});
