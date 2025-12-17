const Service = require("../models/Service");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json({ status: "ok", data: services });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const newService = await Service.create(req.body);
    res.json({ status: "ok", data: newService });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await Service.findByIdAndUpdate(id, req.body, {
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
    const deletedService = await Service.findByIdAndDelete(id);

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
