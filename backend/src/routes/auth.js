const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/securityMiddleware');

// RATE LIMITING - Limitar intentos de registro
router.post('/register', registerLimiter, authController.register);

// RATE LIMITING - Limitar intentos de login
router.post('/login', loginLimiter, authController.login);

module.exports = router;