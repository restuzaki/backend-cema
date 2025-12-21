const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../config/roles");
const loginService = require("../services/loginService");

exports.register = async (req, res) => {
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
    const user = await User.create({
      email,
      password: hashedPassword,
      role: ROLES.CLIENT,
    });

    console.log(`User baru terdaftar: ${email}`);
    res.json({ status: "success", message: "Registrasi berhasil" });
  } catch (error) {
    console.error(error);
    res.json({ status: "error", error: "Terjadi kesalahan server" });
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
