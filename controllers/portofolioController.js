// portfolioController.js
let portfolioData = require("../model/portfolio");

exports.getAllPortfolio = (req, res) => {
  res.json({
    status: "success",
    total: portfolioData.length,
    data: portfolioData
  });
};

exports.getPortfolioById = (req, res) => {
  const id = parseInt(req.params.id);
  const item = portfolioData.find(p => p.id === id);

  if (!item) return res.status(404).json({ message: "Portfolio not found" });

  res.json({ status: "success", data: item });
};

exports.createPortfolio = (req, res) => {
  const { category, date, description } = req.body;

  if (!category || !date || !description)
    return res.status(400).json({
      message: "Category, date, and description are required"
    });

  const newPortfolio = {
    id: portfolioData.length ? portfolioData[portfolioData.length - 1].id + 1 : 1,
    category,
    date,
    description,
    image: req.file ? req.file.filename : null
  };

  portfolioData.push(newPortfolio);

  res.json({
    status: "success",
    message: "Portfolio created",
    data: newPortfolio
  });
};

exports.updatePortfolio = (req, res) => {
  const id = parseInt(req.params.id);
  const item = portfolioData.find(p => p.id === id);

  if (!item) return res.status(404).json({ message: "Portfolio not found" });

  item.category = req.body.category || item.category;
  item.date = req.body.date || item.date;
  item.description = req.body.description || item.description;

  if (req.file) item.image = req.file.filename;

  res.json({
    status: "success",
    message: "Portfolio updated",
    data: item
  });
};

exports.deletePortfolio = (req, res) => {
  const id = parseInt(req.params.id);
  const index = portfolioData.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).json({ message: "Portfolio not found" });

  portfolioData.splice(index, 1);

  res.json({
    status: "success",
    message: "Portfolio deleted"
  });
};
