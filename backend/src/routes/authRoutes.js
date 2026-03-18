const express = require('express');
const router = express.Router();
const { 
  register, login, me, sendVerification, verifyOtp, deleteAccount,
  registerValidators, loginValidators, sendVerificationValidators, verifyOtpValidators 
} = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

// POST /auth/register
router.post('/register', registerValidators, validate, register);

// POST /auth/login
router.post('/login', loginValidators, validate, login);

// GET /auth/me  – protected
router.get('/me', authenticate, me);

// DELETE /auth/me - protected
router.delete('/me', authenticate, deleteAccount);

// POST /auth/send-verification – protected
router.post('/send-verification', authenticate, sendVerificationValidators, validate, sendVerification);

// POST /auth/verify-otp – protected
router.post('/verify-otp', authenticate, verifyOtpValidators, validate, verifyOtp);

module.exports = router;
