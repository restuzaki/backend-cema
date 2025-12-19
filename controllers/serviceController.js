const ServiceSchema = require("../models/serviceSchema");

exports.getAllServices = async (req, res) => {
  try {
    const services = await ServiceSchema.find();
    res.json({ status: "ok", data: services });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.getShownServices = async (req, res) => {
  try {
    const services = await ServiceSchema.find({ isShown: true });
    res.json({ status: "ok", data: services });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const {
      title,
      category,
      price,
      image,
      description,
      features,
      isPopular,
      isShown,
    } = req.body;

    const newService = await ServiceSchema.create({
      title,
      category,
      price,
      image,
      description,
      features,
      isPopular: isPopular !== undefined ? isPopular : false,
      isShown: isShown !== undefined ? isShown : true,
    });

    res.json({ status: "ok", data: newService });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await ServiceSchema.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedService) {
      return res
        .status(404)
        .json({ status: "error", message: "Service tidak ditemukan" });
    }

    res.json({
      status: "ok",
      data: updatedService,
      message: "Data berhasil diupdate",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedService = await ServiceSchema.findByIdAndDelete(id);

    if (!deletedService) {
      return res
        .status(404)
        .json({ status: "error", message: "Service tidak ditemukan" });
    }

    res.json({ status: "ok", message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
