const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
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
    phoneNumber: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    fcm_token: {
      type: String,
      default: "",
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
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Don't expose password in responses
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", UserSchema);
