const { body } = require('express-validator');
const { Rating, Doctor, Appointment, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { Sequelize } = require('sequelize');

// ─── Validation Rules ─────────────────────────────────────────

const submitRatingValidators = [
  body('appointment_id').isUUID().withMessage('Valid appointment_id is required'),
  body('stars').isInt({ min: 1, max: 5 }).withMessage('Stars must be 1–5'),
  body('comment').optional().isString().trim(),
];

// ─── Controllers ──────────────────────────────────────────────

/**
 * POST /ratings
 * Patient submits a rating for a completed appointment
 */
const submitRating = async (req, res) => {
  try {
    const { appointment_id, stars, comment } = req.body;
    const patient_id = req.user.id;

    // Verify appointment: must be completed and belong to this patient
    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) return errorResponse(res, 'Appointment not found', 404);
    if (appointment.patient_id !== patient_id) return errorResponse(res, 'Access denied', 403);
    if (appointment.status !== 'completed') return errorResponse(res, 'You can only rate completed appointments', 400);

    // Check if already rated (unique constraint also enforces this at DB level)
    const existing = await Rating.findOne({ where: { appointment_id } });
    if (existing) return errorResponse(res, 'You have already rated this appointment', 409);

    const doctor_id = appointment.doctor_id;

    const rating = await Rating.create({
      appointment_id,
      patient_id,
      doctor_id,
      stars,
      comment: comment || null,
    });

    // Recalculate doctor's average rating
    const { avg } = await Rating.findOne({
      where: { doctor_id },
      attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'avg']],
      raw: true,
    });

    const doctor = await Doctor.findOne({ where: { user_id: doctor_id } });
    if (doctor) {
      await doctor.update({ avg_rating: parseFloat(Number(avg).toFixed(2)) });
    }

    return successResponse(res, rating, 'Rating submitted successfully', 201);
  } catch (err) {
    console.error('[Ratings] Submit error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'You have already rated this appointment', 409);
    }
    return errorResponse(res, 'Failed to submit rating', 500);
  }
};

/**
 * GET /ratings/doctor/:doctorId
 * Public — get all ratings for a doctor with computed average
 */
const getDoctorRatings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const ratings = await Rating.findAll({
      where: { doctor_id: doctorId },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const total = ratings.length;
    const avg = total > 0
      ? (ratings.reduce((sum, r) => sum + r.stars, 0) / total).toFixed(2)
      : 0;

    return successResponse(res, { avg_rating: parseFloat(avg), total_ratings: total, ratings });
  } catch (err) {
    console.error('[Ratings] GetDoctorRatings error:', err);
    return errorResponse(res, 'Failed to fetch ratings', 500);
  }
};

/**
 * GET /ratings/my-rating/:appointmentId
 * Check if the current patient has already rated an appointment
 */
const getMyRating = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const rating = await Rating.findOne({
      where: { appointment_id: appointmentId, patient_id: req.user.id },
    });
    return successResponse(res, rating || null);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch rating', 500);
  }
};

module.exports = { submitRating, getDoctorRatings, getMyRating, submitRatingValidators };
