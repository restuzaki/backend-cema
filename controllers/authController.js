const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ROLES = require("../config/roles");

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
    res.json({ status: "ok", message: "Registrasi berhasil" });
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
        status: "ok",
        message: "Login berhasil",
        token,
        role: user.role,
        id: user._id,
      });
    }
    // ------------------------------------------------------

    res.json({ status: "error", error: "Email atau password salah" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Server error" });
  }
};
