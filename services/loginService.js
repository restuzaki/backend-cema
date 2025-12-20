const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../config/roles");

/**
 * Google OAuth Login Service
 * Handles user authentication via Google OAuth and JWT token generation
 */

/**
 * Verify Google ID Token and authenticate user
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} - User data and JWT token
 */
exports.googleLogin = async (idToken) => {
  try {
    if (!idToken) {
      throw new Error("ID token is required");
    }

    // Decode the Google ID token
    // In production, you should verify this token with Google's API
    // For now, we'll decode it locally
    const decoded = jwt.decode(idToken, { complete: true });

    if (!decoded) {
      throw new Error("Invalid token format");
    }

    const googlePayload = decoded.payload;
    const { sub: googleId, email, name, picture } = googlePayload;

    if (!email) {
      throw new Error("Email not found in token");
    }

    // Check if user exists
    let user = await User.findOne({ email }).lean();

    if (user) {
      // Update existing user with Google profile info if not already set
      if (!user.googleId) {
        await User.updateOne(
          { _id: user._id },
          { googleId, name, profilePicture: picture }
        );
      }
    } else {
      // Create new user from Google data
      user = await User.create({
        email,
        googleId,
        name,
        profilePicture: picture,
        role: ROLES.CLIENT,
        // No password for OAuth users
      });

      user = user.toObject();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        googleId: googleId
      },
      process.env.JWT_SECRET || "cema-secret-key",
      { expiresIn: "24h" }
    );

    console.log(`Google OAuth login successful for: ${email}`);

    return {
      status: "ok",
      message: "Google login berhasil",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Google login error:", error.message);
    throw new Error(`Google authentication failed: ${error.message}`);
  }
};

/**
 * Verify Google ID token with Google's API (more secure)
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} - Verified token payload
 */
exports.verifyGoogleToken = async (idToken) => {
  try {
    const { OAuth2Client } = require("google-auth-library");

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    throw new Error("Invalid Google token");
  }
};
