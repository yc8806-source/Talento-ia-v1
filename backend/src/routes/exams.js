const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// POST routes
router.post('/', examController.createExam);
router.post('/:examId/questions', examController.addQuestionsToExam);

// GET routes
router.get('/', examController.getExams);
router.get('/:id', examController.getExamById);

// PUT routes
router.put('/:id', examController.updateExam);

// DELETE routes
router.delete('/:examId/questions/:questionId', examController.removeQuestionFromExam);
router.delete('/:id', examController.deleteExam);

module.exports = router;
