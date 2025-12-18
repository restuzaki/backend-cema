const mongoose = require("mongoose");

const PortfolioSchemaDummy = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Portfolio", PortfolioSchemaDummy);
