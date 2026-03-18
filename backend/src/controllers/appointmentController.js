const { body } = require('express-validator');
const { Appointment, User, Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { sendAppointmentBookedEmail, sendAppointmentStatusEmail } = require('../utils/otp');
const { Op } = require('sequelize');

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

    // Verify doctor exists
    const doctor = await User.findOne({ where: { id: doctor_id, role: 'doctor' } });
    if (!doctor) {
      return errorResponse(res, 'Doctor not found', 404);
    }

    const selectedTime = new Date(appointment_time);
    const windowStart = new Date(selectedTime.getTime() - 30 * 60 * 1000); // -30 min
    const windowEnd   = new Date(selectedTime.getTime() + 30 * 60 * 1000); // +30 min

    // Prevent double-booking within ±30 min window for the same doctor
    const conflict = await Appointment.findOne({
      where: {
        doctor_id,
        status: ['pending', 'confirmed'],
        appointment_time: { [Op.between]: [windowStart, windowEnd] },
      },
    });
    if (conflict) {
      return errorResponse(
        res,
        'This time slot is not available. Please choose a slot at least 30 minutes away from an existing appointment.',
        409
      );
    }

    const appointment = await Appointment.create({
      doctor_id,
      patient_id,
      appointment_time: selectedTime,
      reason: reason || null,
      status: 'pending',
    });

    const patient = await User.findByPk(patient_id);

    // Send email notifications (non-blocking)
    sendAppointmentBookedEmail({
      patientEmail: patient.email,
      patientName: patient.name,
      doctorEmail: doctor.email,
      doctorName: doctor.name,
      appointmentTime: selectedTime,
      reason,
    }).catch(err => console.error('[Mailer] Appointment booked email failed:', err));

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
        where: { doctor_id: userId, is_archived: false },
        include: [{ model: User, as: 'patient', attributes: ['id', 'name', 'email'] }],
        order: [['appointment_time', 'ASC']],
      });
    } else {
      appointments = await Appointment.findAll({
        where: { patient_id: userId },
        include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'email'] }],
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

    const isDoctor = appointment.doctor_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isPatient = appointment.patient_id === req.user.id;

    if (!isDoctor && !isAdmin && !isPatient) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (isPatient && !['cancelled', 'completed'].includes(status)) {
      return errorResponse(res, 'Patients can only mark appointments as cancelled or completed', 403);
    }

    await appointment.update({ status });

    // Send status update email to patient (non-blocking)
    const patient = await User.findByPk(appointment.patient_id);
    const doctor = await User.findByPk(appointment.doctor_id);

    sendAppointmentStatusEmail({
      patientEmail: patient.email,
      patientName: patient.name,
      doctorName: doctor.name,
      appointmentTime: appointment.appointment_time,
      status,
    }).catch(err => console.error('[Mailer] Status email failed:', err));

    return successResponse(res, appointment, 'Appointment status updated');
  } catch (err) {
    console.error('[Appointments] Update status error:', err);
    return errorResponse(res, 'Failed to update appointment', 500);
  }
};

/**
 * PATCH /appointments/:id/archive
 * Hide an appointment from the doctor's dashboard
 */
const archiveAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    if (appointment.doctor_id !== req.user.id) {
      return errorResponse(res, 'Access denied', 403);
    }

    await appointment.update({ is_archived: true });
    return successResponse(res, appointment, 'Appointment hidden from dashboard');
  } catch (err) {
    console.error('[Appointments] Archive error:', err);
    return errorResponse(res, 'Failed to archive appointment', 500);
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  archiveAppointment,
  bookAppointmentValidators,
};
