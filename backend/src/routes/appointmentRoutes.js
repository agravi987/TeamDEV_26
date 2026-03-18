const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  archiveAppointment,
  bookAppointmentValidators,
} = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');

// POST /appointments – patients only
router.post('/', authenticate, authorize('patient'), bookAppointmentValidators, validate, bookAppointment);

// GET /appointments/:userId – own user or admin
router.get('/:userId', authenticate, getUserAppointments);

// PATCH /appointments/:id/status – doctor or admin
router.patch('/:id/status', authenticate, authorize('doctor', 'admin'), updateAppointmentStatus);

// PATCH /appointments/:id/archive - doctor only
router.patch('/:id/archive', authenticate, authorize('doctor'), archiveAppointment);

module.exports = router;
