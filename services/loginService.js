const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../config/roles");
const admin = require("../config/firebaseAdmin");
/**
 * Google OAuth Login Service
 * Handles user authentication via Google OAuth and JWT token generation
 */

exports.googleLogin = async (idToken) => {
  const decoded = await admin.auth().verifyIdToken(idToken);
  const { uid, email, name, picture } = decoded;

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      email,
      googleId: uid,
      name,
      profilePicture: picture,
      password: hashedPassword, // Password random untuk keamanan skema
      role: ROLES.CLIENT,
    });
    console.log(`User baru (Google) terdaftar: ${email}`);
  }

  // STEP 4 & 5: Melakukan jwt.sign dan mengembalikan data
  const appToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    status: "success",
    message: "Login berhasil",
    token: appToken,
    role: user.role,
    id: user._id,
  };
};

// exports.verifyGoogleToken = async (idToken) => {
//   try {
//     const { OAuth2Client } = require("google-auth-library");

//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//     const ticket = await client.verifyIdToken({
//       idToken: idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     return payload;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     throw new Error("Invalid Google token");
//   }
// };
