const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkPermission = require("../middleware/abacMiddleware");
const quizController = require("../controllers/quizController");

router.get("/quiz-questions", quizController.getAllQuestions);
router.get(
  "/quiz-questions/:id",
  authMiddleware,
  checkPermission("quiz_questions", "view"),
  quizController.getQuestionById
);
router.post(
  "/quiz-questions",
  authMiddleware,
  checkPermission("quiz_questions", "create"),
  quizController.createQuestion
);
router.put(
  "/quiz-questions/:id",
  authMiddleware,
  checkPermission("quiz_questions", "update"),
  quizController.updateQuestion
);
router.delete(
  "/quiz-questions/:id",
  authMiddleware,
  checkPermission("quiz_questions", "delete"),
  quizController.deleteQuestion
);

module.exports = router;
