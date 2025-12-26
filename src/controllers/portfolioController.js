const Portfolio = require("../models/portfolio");
const fs = require("fs");
const path = require("path");

/**
 * Helper: Menghapus file fisik dari folder uploads
 */
const deleteFile = (filename) => {
  if (!filename || filename === "default.jpg") return;

  // Sesuaikan path: asumsi controller di folder /controllers dan uploads di root
  const filePath = path.join(__dirname, "../uploads", filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Gagal menghapus file fisik:", err);
      else console.log(`Berhasil menghapus file: ${filename}`);
    });
  }
};

// 1. Ambil Semua Portfolio
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

// 2. Ambil Portfolio yang Ditampilkan (isShown: true)
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

// 3. Ambil Portfolio Berdasarkan ID
exports.getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findOne({ id: id });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio tidak ditemukan" });
    }

    res.json({ status: "success", data: portfolio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Tambah Portfolio Baru
exports.createPortfolio = async (req, res) => {
  try {
    const { displayName, category, endDate, description, isShown } =
      req.body || {};

    // Validasi Field Wajib
    if (!displayName || !category || !endDate || !description) {
      if (req.file) deleteFile(req.file.filename); // Hapus file jika validasi gagal
      return res.status(400).json({
        message:
          "Display Name, Category, End Date, dan Description wajib diisi",
      });
    }

    const newPortfolio = new Portfolio({
      id: `PORT-${Date.now()}`,
      displayName,
      category,
      endDate,
      description,
      // Konversi string "true" dari FormData ke boolean
      isShown: String(isShown) === "true",
      photoUrl: req.file ? req.file.filename : "default.jpg",
    });

    const savedPortfolio = await newPortfolio.save();
    res.status(201).json({ status: "success", data: savedPortfolio });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    res.status(500).json({ message: error.message });
  }
};

// 5. Update Portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Jika ada upload file baru
    if (req.file) {
      const oldPortfolio = await Portfolio.findOne({ id: id });
      if (oldPortfolio && oldPortfolio.photoUrl) {
        deleteFile(oldPortfolio.photoUrl); // Hapus foto lama
      }
      updateData.photoUrl = req.file.filename;
    }

    // Pastikan isShown dikonversi ke Boolean jika ada di body
    if (updateData.isShown !== undefined) {
      updateData.isShown = String(updateData.isShown) === "true";
    }

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPortfolio) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(404).json({ message: "Portfolio tidak ditemukan" });
    }

    res.json({ status: "success", data: updatedPortfolio });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    res.status(500).json({ message: error.message });
  }
};

// 6. Hapus Portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findOne({ id: id });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio tidak ditemukan" });
    }

    // Hapus file fisik jika ada
    if (portfolio.photoUrl) {
      deleteFile(portfolio.photoUrl);
    }

    await Portfolio.findOneAndDelete({ id: id });

    res.json({
      status: "success",
      message: "Portfolio dan file terkait berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
