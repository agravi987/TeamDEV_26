const express = require('express');
const router = express.Router();
const { register, login, me, registerValidators, loginValidators } = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

// POST /auth/register
router.post('/register', registerValidators, validate, register);

// POST /auth/login
router.post('/login', loginValidators, validate, login);

// GET /auth/me  – protected
router.get('/me', authenticate, me);

module.exports = router;
