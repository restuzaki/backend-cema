const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");

// Routes
// Note: We use checkPermission middleware for 'create' which doesn't need data.
// For 'view', 'update', 'delete', we might rely on the Controller to perform the granular ID check
// because standard checkPermission middleware might not fetch the target resource automatically for "users".

// 1. Get All Users (Admin Only)
// Permission: users:view is true for Admin, function for others.
// If it's a function (Own Only), they can't view ALL.
// So this route implicitly requires the permission to be TRUE (not function), OR we filter in controller.
// Currently abacMiddleware returns 403 if permission is a function but no data is passed?
// Let's rely on controller validaton for specific ID.
// For "Get All", usually restricted to Admin.
// We can use checkPermission("users", "view") -> Admin passes (true). Client fails (needs data).
router.get(
  "/",
  authMiddleware,
  checkPermission("users", "view"),
  userController.getAllUsers
);

// 2. Create User (Admin Only)
router.post(
  "/",
  authMiddleware,
  checkPermission("users", "create"),
  userController.createUser
);

// 3. Get User By ID (Own Only or Admin)
// We skip checkPermission here and do it inside controller because we need to fetch User DB object first.
// OR we can genericize it if checkPermission supported lookups.
router.get("/:id", authMiddleware, userController.getUserById);

// 4. Update User (Own Only or Admin)
router.put("/:id", authMiddleware, userController.updateUser);

// 5. Delete User (Own Only or Admin)
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
