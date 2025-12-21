require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const admin = require("firebase-admin");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const projectRoutes = require("./routes/projectRoute");
const taskRoutes = require("./routes/taskRoute");
const scheduleRoutes = require("./routes/scheduleRoute");
const quizRoutes = require("./routes/quizRoute");
const calculatorRoutes = require("./routes/calculatorRoute");
const serviceRoutes = require("./routes/serviceRoute");
const portfolioRoutes = require("./routes/portfolioRoute");
const userRoutes = require("./routes/userRoute");
const startChatBot = require("./services/chatService");

const serviceAccount = require("./cema-web-firebase-adminsdk-fbsvc-7db7e59049.json");

const app = express();
const PORT = process.env.PORT || 5000;
process.env.TZ = "Asia/Jakarta";

connectDB();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.database();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", quizRoutes);
app.use("/api", calculatorRoutes);
app.use("/api", serviceRoutes);
app.use("/api", portfolioRoutes);
app.use("/api/users", userRoutes);

startChatBot(db);

app.listen(PORT, () => {
  console.log(`🚀 API Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;
