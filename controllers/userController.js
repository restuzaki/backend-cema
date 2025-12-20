const User = require("../models/User");
const bcrypt = require("bcryptjs"); // For hashing password
const { hasPermission } = require("../policies/abacPolicies");

// Helper to filter sensitive data from response
const sanitizeUser = (user) => {
  const { password, ...userData } = user.toObject ? user.toObject() : user;
  return userData;
};

// 1. Get All Users (Admin Only usually, or filtered)
exports.getAllUsers = async (req, res) => {
  try {
    // Basic filter: if not admin, maybe return error or restricted list?
    // ABAC middleware handles permission check 'view' for 'users'.
    // If logic is "view: true" (Admin), they pass.
    // If logic is "view: (user, target) => user.id === target.id", this endpoint is tricky because there is no single target.
    // Convention: getAll usually implies Admin privilege or public list.
    // For now, we fetch all.
    const users = await User.find();

    // Sanitize
    const safeUsers = users.map((u) => sanitizeUser(u));

    res.json({
      status: "success",
      total: safeUsers.length,
      data: safeUsers,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. Get User By ID
exports.getUserById = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Manual ABAC Check because we need 'targetUser' data for the decision
    // Middleware checks "users", "view" but passed 'undefined' as target.
    // We should re-check with target data if the middleware was generic.
    // However, usually we rely on middleware.
    // If the policy is (user, target) => user.id === target.id, we MUST pass target.
    // Let's assume middleware passes if logic is function? No, middleware executes logic.
    // So we need to call checkPermission here manually IF logic involves data.

    // Wait, middleware `abacMiddleware.js` handles data fetching for some resources?
    // Or we do it here.
    // Ideally, we do it here:
    if (!hasPermission(req.user, "users", "view", targetUser)) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    res.json({
      status: "success",
      data: sanitizeUser(targetUser),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 3. Create User (Admin Only - Manual creation)
exports.createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ status: "error", message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || "CLIENT", // Default or Admin specified
    });

    res.status(201).json({
      status: "success",
      data: sanitizeUser(newUser),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 4. Update User
exports.updateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    // ABAC Check
    if (!hasPermission(req.user, "users", "update", targetUser)) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    // Allowed updates
    // Prevent updating 'role' if not Admin?
    const { email, password, role, ...otherData } = req.body;

    if (email) targetUser.email = email;
    if (password) {
      targetUser.password = await bcrypt.hash(password, 10);
    }

    // Only Admin can update Role
    if (role && req.user.role === "ADMIN") {
      targetUser.role = role;
    }

    // Save
    await targetUser.save();

    res.json({
      status: "success",
      data: sanitizeUser(targetUser),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 5. Delete User
exports.deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    // ABAC Check
    if (!hasPermission(req.user, "users", "delete", targetUser)) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }

    // Use deleteOne or findOneAndDelete
    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
