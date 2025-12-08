require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const startChatBot = require("./services/chatService");

const app = express();
const PORT = process.env.PORT || 3000;
process.env.TZ = "Asia/Jakarta";

const serviceAccount = require("./cema-web-firebase-adminsdk-fbsvc-7db7e59049.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.database();

connectDB();

//Middleware
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);

startChatBot(db);

app.listen(PORT, () => {
  console.log(`🚀 API Server berjalan di http://localhost:${PORT}`);
});
