const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../config/roles");
const loginService = require("../services/loginService");
  
exports.register = async (req, res) => {
  try {
        const { name, phoneNumber, email, password } = req.body;

        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create and save user to database
        const newUser = new User({
            name,
            phoneNumber,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        // 4. Send success response
        res.status(201).json({
          status: "success",
          message: "User registered successfully",
          user: {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role || null
          }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.json({ status: "error", error: "Email atau password salah" });
    }

    // USE JWT TO SIMULATE ABAC POLICY (CAN BE CHANGED LATER)
    if (await bcrypt.compare(password, user.password)) {
      console.log(`User login: ${email}`);
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "cema-secret-key",
        { expiresIn: "24h" }
      );

      return res.json({
        status: "success",
        message: "Login berhasil",
        token,
        role: user.role,
        id: user._id,
      });
    }

    res.json({ status: "error", error: "Email atau password salah" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Server error" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        status: "error",
        error: "ID token diperlukan",
      });
    }

    // Call the login service
    const result = await loginService.googleLogin(idToken);

    return res.json(result);
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({
      status: "error",
      error: error.message || "Google authentication gagal",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = req.user; // Decoded from authMiddleware

    // Create a new token with fresh expiry
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "cema-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      status: "ok",
      message: "Token duration reset",
      token: newToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ status: "error", error: "Failed to refresh token" });
  }
};
