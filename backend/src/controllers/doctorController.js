const { User, Doctor } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /doctors
 * Fetch all registered doctors with their profiles
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      attributes: ['id', 'specialization', 'availability', 'experience_years', 'consultation_fee', 'bio'],
    });

    return successResponse(res, doctors);
  } catch (err) {
    console.error('[Doctors] GetAll error:', err);
    return errorResponse(res, 'Failed to fetch doctors', 500);
  }
};

/**
 * GET /doctors/:id
 * Get a specific doctor profile
 */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!doctor) {
      return errorResponse(res, 'Doctor not found', 404);
    }

    return successResponse(res, doctor);
  } catch (err) {
    console.error('[Doctors] GetById error:', err);
    return errorResponse(res, 'Failed to fetch doctor', 500);
  }
};

/**
 * PATCH /doctors/profile
 * Update the authenticated doctor's own profile
 */
const updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, availability, experience_years, consultation_fee, bio } = req.body;

    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    if (!doctor) {
      return errorResponse(res, 'Doctor profile not found', 404);
    }

    await doctor.update({
      ...(specialization && { specialization }),
      ...(availability && { availability }),
      ...(experience_years !== undefined && { experience_years }),
      ...(consultation_fee !== undefined && { consultation_fee }),
      ...(bio && { bio }),
    });

    return successResponse(res, doctor, 'Profile updated');
  } catch (err) {
    console.error('[Doctors] Update profile error:', err);
    return errorResponse(res, 'Failed to update doctor profile', 500);
  }
};

module.exports = { getAllDoctors, getDoctorById, updateDoctorProfile };
