const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
    unique: true, 
    sparse: true, 
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  role: {
    type: String,
    enum: ["client", "admin", "project_manager", "staff"],
    default: "client",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
