const { User, Doctor, Appointment } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

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
      attributes: ['id', 'specialization', 'availability', 'experience_years', 'consultation_fee', 'bio', 'avg_rating'],
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

/**
 * GET /doctors/:id/available-slots?date=YYYY-MM-DD
 * Returns ALL 30-min slots for a doctor on a given date, each with status: 'free' | 'booked'
 * Doctor's availability JSON: { "monday": ["09:00", "17:00"], "tuesday": [...] }
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // e.g. "2026-03-20"

    if (!date) {
      return errorResponse(res, 'date query param is required (YYYY-MM-DD)', 400);
    }

    const doctor = await Doctor.findOne({ where: { user_id: id } });
    if (!doctor) {
      return errorResponse(res, 'Doctor not found', 404);
    }

    const availability = doctor.availability || {};
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const daySlot = availability[dayOfWeek];
    if (!daySlot || daySlot.length < 2) {
      return successResponse(res, [], 'Doctor is not available on this day');
    }

    const [startStr, endStr] = daySlot;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    // Generate all 30-min slots in the range
    const allSlots = [];
    let current = new Date(`${date}T${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}:00`);
    const end = new Date(`${date}T${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}:00`);

    while (current < end) {
      allSlots.push(new Date(current));
      current = new Date(current.getTime() + 30 * 60 * 1000);
    }

    // Find already booked appointments for this doctor on this date
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd   = new Date(`${date}T23:59:59`);

    const booked = await Appointment.findAll({
      where: {
        doctor_id: id,
        status: ['pending', 'confirmed'],
        appointment_time: { [Op.between]: [dayStart, dayEnd] },
      },
      attributes: ['appointment_time'],
    });

    const bookedMs = new Set(booked.map(a => new Date(a.appointment_time).getTime()));

    // Return all slots with status — blocked if within ±30min of a booked appointment
    const result = allSlots.map(slot => {
      const slotMs = slot.getTime();
      let isBooked = false;
      for (const bMs of bookedMs) {
        if (Math.abs(slotMs - bMs) < 30 * 60 * 1000) {
          isBooked = true;
          break;
        }
      }
      return { time: slot.toISOString(), status: isBooked ? 'booked' : 'free' };
    });

    return successResponse(res, result);
  } catch (err) {
    console.error('[Doctors] GetAvailableSlots error:', err);
    return errorResponse(res, 'Failed to fetch available slots', 500);
  }
};


module.exports = { getAllDoctors, getDoctorById, updateDoctorProfile, getAvailableSlots };
