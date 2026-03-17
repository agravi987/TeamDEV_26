const { body, param } = require('express-validator');
const { Appointment, User, Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// ─── Validation Rules ─────────────────────────────────────────

const bookAppointmentValidators = [
  body('doctor_id').isUUID().withMessage('Valid doctor_id (UUID) is required'),
  body('appointment_time').isISO8601().withMessage('appointment_time must be a valid ISO 8601 date'),
  body('reason').optional().isString().trim(),
];

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /appointments
 * Book a new appointment (patient only)
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_time, reason } = req.body;
    const patient_id = req.user.id;

    // Verify doctor exists and is actually a doctor
    const doctor = await User.findOne({ where: { id: doctor_id, role: 'doctor' } });
    if (!doctor) {
      return errorResponse(res, 'Doctor not found', 404);
    }

    // Prevent double-booking same slot
    const conflict = await Appointment.findOne({
      where: {
        doctor_id,
        appointment_time,
        status: ['pending', 'confirmed'],
      },
    });
    if (conflict) {
      return errorResponse(res, 'This slot is already booked for the selected doctor', 409);
    }

    const appointment = await Appointment.create({
      doctor_id,
      patient_id,
      appointment_time,
      reason: reason || null,
      status: 'pending',
    });

    return successResponse(res, appointment, 'Appointment booked successfully', 201);
  } catch (err) {
    console.error('[Appointments] Book error:', err);
    return errorResponse(res, 'Failed to book appointment', 500);
  }
};

/**
 * GET /appointments/:userId
 * Get appointments for a specific user (doctor or patient)
 */
const getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to view their own appointments unless they are admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let appointments;
    if (user.role === 'doctor') {
      appointments = await Appointment.findAll({
        where: { doctor_id: userId },
        include: [{ model: User, as: 'patient', attributes: ['id', 'name', 'email'] }],
        order: [['appointment_time', 'ASC']],
      });
    } else {
      appointments = await Appointment.findAll({
        where: { patient_id: userId },
        include: [
          { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
        ],
        order: [['appointment_time', 'ASC']],
      });
    }

    return successResponse(res, appointments);
  } catch (err) {
    console.error('[Appointments] Get error:', err);
    return errorResponse(res, 'Failed to fetch appointments', 500);
  }
};

/**
 * PATCH /appointments/:id/status
 * Update appointment status (doctor or admin)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const VALID_STATUSES = ['confirmed', 'cancelled', 'completed'];

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 422);
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Only the doctor of this appointment or admin can change status
    if (appointment.doctor_id !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    await appointment.update({ status });
    return successResponse(res, appointment, 'Appointment status updated');
  } catch (err) {
    console.error('[Appointments] Update status error:', err);
    return errorResponse(res, 'Failed to update appointment', 500);
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  bookAppointmentValidators,
};
