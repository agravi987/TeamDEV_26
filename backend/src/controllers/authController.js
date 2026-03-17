const { body } = require('express-validator');
const { User, Doctor } = require('../models');
const { generateToken } = require('../utils/jwt');
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

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', specialization, availability } = req.body;

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
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return successResponse(
      res,
      { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      'Registration successful',
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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

module.exports = { register, login, me, registerValidators, loginValidators };
