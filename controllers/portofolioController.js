const Portfolio = require("../models/portfolio");

exports.getAllPortfolio = async (req, res) => {
  try {
    const portfolios = await Portfolio.find();
    res.json({
      status: "success",
      total: portfolios.length,
      data: portfolios,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShownPortfolio = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ isShown: true });
    res.json({
      status: "success",
      total: portfolios.length,
      data: portfolios,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findOne({ id: id });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json({ status: "success", data: portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPortfolio = async (req, res) => {
  try {
    const { id, displayName, category, endDate, description, isShown } =
      req.body;

    // Validate required fields
    if (!id || !displayName || !category || !endDate || !description) {
      return res.status(400).json({
        message:
          "ID, Display Name, Category, End Date, and Description are required",
      });
    }

    const newPortfolio = new Portfolio({
      id,
      displayName, // Added displayName as it is required in the schema
      category,
      endDate,
      description,
      isShown: isShown !== undefined ? isShown : true, // Default to true if not provided
      photoUrl: req.file
        ? req.file.filename
        : req.body.photoUrl || "default.jpg",
    });

    const savedPortfolio = await newPortfolio.save();

    res.status(201).json({
      status: "success",
      message: "Portfolio created",
      data: savedPortfolio,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Portfolio with this ID already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
    };

    // If a file is uploaded, update the photoUrl
    if (req.file) {
      updateData.photoUrl = req.file.filename;
    }

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPortfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json({
      status: "success",
      message: "Portfolio updated",
      data: updatedPortfolio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPortfolio = await Portfolio.findOneAndDelete({ id: id });

    if (!deletedPortfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json({
      status: "success",
      message: "Portfolio deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
