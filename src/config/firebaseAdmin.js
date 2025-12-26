// src/config/firebaseAdmin.js
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://cema-web-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

module.exports = admin;
