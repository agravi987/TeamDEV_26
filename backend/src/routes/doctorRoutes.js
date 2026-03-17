const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById, updateDoctorProfile } = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// GET /doctors – public
router.get('/', getAllDoctors);

// GET /doctors/:id – public
router.get('/:id', getDoctorById);

// PATCH /doctors/profile – doctors only
router.patch('/profile', authenticate, authorize('doctor'), updateDoctorProfile);

module.exports = router;
