require("dotenv").config();
const express = require("express");
const cors = require("cors");

const admin = require("./config/firebaseAdmin");
const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoute");
const projectRoutes = require("./routes/projectRoute");
const taskRoutes = require("./routes/taskRoute");
const scheduleRoutes = require("./routes/scheduleRoute");
const quizRoutes = require("./routes/quizRoute");
const calculatorRoutes = require("./routes/calculatorRoute");
const serviceRoutes = require("./routes/serviceRoute");
const portfolioRoutes = require("./routes/portfolioRoute");
const userRoutes = require("./routes/userRoute");

// SERVICES
const startChatBot = require("./services/chatService");

// APP
const app = express();
const PORT = process.env.PORT || 5000;
process.env.TZ = "Asia/Jakarta";

// DB
connectDB();

const db = admin.database();

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ROUTES (TETAP SAMA)
app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", quizRoutes);
app.use("/api", calculatorRoutes);
app.use("/api", serviceRoutes);
app.use("/api", portfolioRoutes);
app.use("/api/users", userRoutes);

// SERVICES
startChatBot(db);

// SERVER
app.listen(PORT, () => {
  console.log(`🚀 API Server berjalan di http://localhost:${PORT}`);
});
