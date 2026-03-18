const { body } = require('express-validator');
const { User, Doctor, Appointment } = require('../models');
const { generateToken } = require('../utils/jwt');
const { generateNumericOTP, sendEmailOTP, sendWelcomeEmail } = require('../utils/otp');
const { successResponse, errorResponse } = require('../utils/response');

// ─── Validation Rules ─────────────────────────────────────────

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor'])
    .withMessage('Role must be patient or doctor'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const sendVerificationValidators = [
  body('medium').isIn(['email']).withMessage('Medium must be email'),
];

const verifyOtpValidators = [
  body('medium').isIn(['email']).withMessage('Medium must be email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP is required'),
];

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', specialization, availability, experience_years } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 'Email is already registered', 409);
    }

    const user = await User.create({ name, email, password, role });

    // If registering as a doctor, create the doctor profile too
    if (role === 'doctor') {
      await Doctor.create({
        user_id: user.id,
        specialization: specialization || 'General',
        availability: availability || {},
        experience_years: experience_years ? parseInt(experience_years, 10) : 0,
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    // Auto-send welcome + OTP emails asynchronously
    const otp = generateNumericOTP(6);
    const expiry = new Date(Date.now() + 10 * 60000);
    user.email_otp = otp;
    user.email_otp_expiry = expiry;
    await user.save();

    sendWelcomeEmail(email, name).catch(err => console.error('[Mailer] Welcome email failed:', err));
    sendEmailOTP(email, otp).catch(err => console.error('[Mailer] OTP email failed:', err));

    return successResponse(
      res,
      { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, is_email_verified: user.is_email_verified } },
      'Registration successful — please verify your email',
      201
    );
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return errorResponse(res, 'Registration failed', 500);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });

    return successResponse(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, is_email_verified: user.is_email_verified },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * GET /auth/me  – returns current authenticated user's profile
 */
const me = async (req, res) => {
  return successResponse(res, req.user);
};

/**
 * POST /auth/send-verification
 */
const sendVerification = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (user.is_email_verified) return errorResponse(res, 'Email already verified', 400);

    const otp = generateNumericOTP(6);
    const expiry = new Date(Date.now() + 10 * 60000);

    user.email_otp = otp;
    user.email_otp_expiry = expiry;
    await user.save();
    await sendEmailOTP(user.email, otp);

    return successResponse(res, null, 'OTP sent to your email');
  } catch (err) {
    console.error('[Auth] Send Verification error:', err);
    return errorResponse(res, 'Failed to send OTP', 500);
  }
};

/**
 * POST /auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (user.is_email_verified) return errorResponse(res, 'Email already verified', 400);
    if (!user.email_otp || user.email_otp !== otp) return errorResponse(res, 'Invalid OTP', 400);
    if (new Date() > user.email_otp_expiry) return errorResponse(res, 'OTP expired', 400);

    user.is_email_verified = true;
    user.email_otp = null;
    user.email_otp_expiry = null;
    await user.save();

    return successResponse(res, null, 'Email verified successfully');
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    return errorResponse(res, 'Failed to verify OTP', 500);
  }
};

/**
 * DELETE /auth/me
 * Permanently deletes the user and associated records.
 */
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role === 'patient') {
      await Appointment.destroy({ where: { patient_id: user.id } });
    } else if (user.role === 'doctor') {
      await Appointment.destroy({ where: { doctor_id: user.id } });
    }

    await user.destroy();

    return successResponse(res, null, 'Account deleted successfully');
  } catch (err) {
    console.error('[Auth] Delete Account error:', err);
    return errorResponse(res, 'Failed to delete account', 500);
  }
};

module.exports = {
  register,
  login,
  me,
  sendVerification,
  verifyOtp,
  deleteAccount,
  registerValidators,
  loginValidators,
  sendVerificationValidators,
  verifyOtpValidators,
};
