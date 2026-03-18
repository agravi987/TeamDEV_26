const { body } = require('express-validator');
const { Appointment, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// ─── Validation Rules ─────────────────────────────────────────

const videoSessionValidators = [
  body('appointment_id').isUUID().withMessage('Valid appointment_id (UUID) is required'),
];

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Generate a Jitsi Meet video session URL
 * Convention: https://meet.jit.si/<unique-room-id>
 */
const generateJitsiLink = (appointmentId) => {
  const roomId = `clinic-${appointmentId}-${uuidv4().split('-')[0]}`;
  const baseUrl = process.env.JITSI_BASE_URL || 'https://meet.jit.si';
  return `${baseUrl}/${roomId}`;
};

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /video-session
 * Generate a Jitsi meeting link for an appointment and save it
 */
const createVideoSession = async (req, res) => {
  try {
    const { appointment_id } = req.body;

    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Only the doctor or patient of this appointment can generate a link
    if (
      appointment.doctor_id !== req.user.id &&
      appointment.patient_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Re-use existing link if already generated
    if (appointment.meeting_link) {
      return successResponse(res, {
        meeting_link: appointment.meeting_link,
        appointment_id,
        reused: true,
      }, 'Meeting link already exists');
    }

    const meetingLink = generateJitsiLink(appointment_id);

    await appointment.update({
      meeting_link: meetingLink,
      status: appointment.status === 'pending' ? 'confirmed' : appointment.status,
    });

    // Asynchronously send SNS notification
    const sns = require('../utils/sns');
    const topicArn = process.env.SNS_CLINIC_TOPIC_ARN;
    if (topicArn) {
      const patient = await User.findByPk(appointment.patient_id);
      const doctor = await User.findByPk(appointment.doctor_id);
      sns.publishToTopic(
        topicArn,
        'Video Session Link Generated',
        `Patient ${patient.name}, your video consultation link with Dr. ${doctor.name} is ready: ${meetingLink}`
      );
    }

    return successResponse(
      res,
      { meeting_link: meetingLink, appointment_id, reused: false },
      'Video session created',
      201
    );
  } catch (err) {
    console.error('[VideoSession] Create error:', err);
    return errorResponse(res, 'Failed to create video session', 500);
  }
};

module.exports = { createVideoSession, videoSessionValidators };
