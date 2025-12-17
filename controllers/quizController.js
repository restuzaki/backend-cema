const QuizQuestion = require("../models/quizQuestion");

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await QuizQuestion.find();
    res.json({ status: "success", data: questions });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to fetch questions" });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await QuizQuestion.findOne({ id: req.params.id });
    if (!question) return res.status(404).json({ status: "error", error: "Question not found" });
    res.json({ status: "success", data: question });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to fetch question" });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { text, imageUrl, relatedStyle, id } = req.body;
    const newQuestion = await QuizQuestion.create({
      id: id || `QZ-${Date.now()}`,
      text,
      imageUrl,
      relatedStyle,
    });
    res.status(201).json({ status: "success", data: newQuestion });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to create question" });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const question = await QuizQuestion.findOne({ id: req.params.id });
    if (!question) return res.status(404).json({ status: "error", error: "Question not found" });

    const { text, imageUrl, relatedStyle } = req.body;
    if (text) question.text = text;
    if (imageUrl) question.imageUrl = imageUrl;
    if (relatedStyle) question.relatedStyle = relatedStyle;

    await question.save();
    res.json({ status: "success", data: question });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to update question" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    await QuizQuestion.findOneAndDelete({ id: req.params.id });
    res.json({ status: "success", message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ status: "error", error: "Failed to delete question" });
  }
};
