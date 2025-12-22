// src/config/firebaseAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("../cema-web-firebase-adminsdk-fbsvc-7db7e59049.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

module.exports = admin;
