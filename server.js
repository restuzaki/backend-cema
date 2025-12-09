require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const projectRoutes = require("./routes/projectRoute");
const taskRoutes = require("./routes/taskRoute");
const startChatBot = require("./services/chatService");

const serviceAccount = require("./cema-web-firebase-adminsdk-fbsvc-7db7e59049.json");

const app = express();
const PORT = process.env.PORT || 5000;
process.env.TZ = "Asia/Jakarta";

connectDB();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.database();

app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);

startChatBot(db);

app.listen(PORT, () => {
  console.log(`🚀 API Server berjalan di http://localhost:${PORT}`);
});