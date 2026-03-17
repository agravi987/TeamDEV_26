const express = require('express');
const router = express.Router();
const {
  uploadPrescription,
  getPrescriptionsByAppointment,
  uploadPrescriptionValidators,
  generatePrescription,
} = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');

// POST /prescriptions/upload – doctors only, file + body fields
router.post(
  '/upload',
  authenticate,
  authorize('doctor', 'admin'),
  upload.single('prescription'),
  uploadPrescriptionValidators,
  validate,
  uploadPrescription
);

// POST /prescriptions/generate - doctors only, dynamic PDF generation
router.post(
  '/generate',
  authenticate,
  authorize('doctor', 'admin'),
  // Add validators here if needed (e.g., validate medicines array)
  generatePrescription
);

// GET /prescriptions/:appointmentId
router.get('/:appointmentId', authenticate, getPrescriptionsByAppointment);

module.exports = router;
