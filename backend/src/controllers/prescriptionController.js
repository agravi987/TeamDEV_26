const { body } = require('express-validator');
const { Prescription, Appointment } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { sendPrescriptionEmail } = require('../utils/otp');

// ─── Validation Rules ─────────────────────────────────────────

const uploadPrescriptionValidators = [
  body('appointment_id').isUUID().withMessage('Valid appointment_id (UUID) is required'),
  body('notes').optional().isString().trim(),
];

const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/aws');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /prescriptions/generate
 * Generate a PDF prescription dynamically and save to S3
 */
const generatePrescription = async (req, res) => {
  try {
    const { appointment_id, medicines, notes } = req.body;

    const appointment = await Appointment.findByPk(appointment_id, {
      include: [
        { 
          model: require('../models').User, 
          as: 'doctor', 
          attributes: ['id', 'name', 'email'],
          include: [{ model: require('../models').Doctor, as: 'doctorProfile', attributes: ['specialization'] }]
        },
        { model: require('../models').User, as: 'patient', attributes: ['id', 'name', 'email'] },
      ]
    });

    if (!appointment) return errorResponse(res, 'Appointment not found', 404);

    // Only doctor or admin
    if (appointment.doctor_id !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Only the treating doctor can generate prescriptions', 403);
    }

    // 1. Generate PDF Buffer
    const pdfBuffer = await generatePrescriptionPDF({
      doctor: {
        name: appointment.doctor.name,
        email: appointment.doctor.email,
        specialization: appointment.doctor.doctorProfile ? appointment.doctor.doctorProfile.specialization : ''
      },
      patient: appointment.patient,
      date: appointment.appointment_time,
      medicines: medicines,
      notes: notes
    });

    // 2. Upload to S3 directly
    const fileKey = `prescriptions/${uuidv4()}.pdf`;
    
    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ACL: 'private',
        Metadata: {
          fieldName: 'prescription',
          uploadedBy: req.user.id,
        }
      }
    };

    const s3Upload = new Upload(uploadParams);
    await s3Upload.done();

    // The direct upload doesn't return the full URL structure multer-s3 did, so we build it manually
    // However, we only rely on file_key to fetch signed URLs, so file_url is not strictly necessary for private access.
    // We'll set a placeholder or standard URL format
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

    const prescription = await Prescription.create({
      appointment_id,
      file_url: fileUrl,
      file_key: fileKey,
      notes: notes || null,
      uploaded_by: req.user.id,
    });

    // Send prescription email to patient (non-blocking)
    if (appointment.patient) {
      sendPrescriptionEmail({
        patientEmail: appointment.patient.email,
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.name,
        appointmentTime: appointment.appointment_time,
      }).catch(err => console.error('[Mailer] Prescription email failed:', err));
    }

    return successResponse(res, prescription, 'Prescription generated and uploaded successfully', 201);
  } catch (err) {
    console.error('[Prescriptions] Generate error:', err);
    return errorResponse(res, 'Failed to generate prescription', 500);
  }
};

/**
 * POST /prescriptions/upload
 * Upload a prescription PDF/image to S3 and save URL
 */
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const { appointment_id, notes } = req.body;

    // Verify the appointment exists
    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Only the appointment's doctor or admin can upload prescriptions
    if (appointment.doctor_id !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Only the treating doctor can upload prescriptions', 403);
    }

    const fileUrl = req.file.location; // S3 URL provided by multer-s3
    const fileKey = req.file.key;       // S3 object key

    const prescription = await Prescription.create({
      appointment_id,
      file_url: fileUrl,
      file_key: fileKey,
      notes: notes || null,
      uploaded_by: req.user.id,
    });

    // Send prescription email to patient (non-blocking)
    const { User } = require('../models');
    const patient = await User.findByPk(appointment.patient_id);
    const doctor = await User.findByPk(appointment.doctor_id);
    if (patient && doctor) {
      sendPrescriptionEmail({
        patientEmail: patient.email,
        patientName: patient.name,
        doctorName: doctor.name,
        appointmentTime: appointment.appointment_time,
      }).catch(err => console.error('[Mailer] Prescription email failed:', err));
    }

    return successResponse(res, prescription, 'Prescription uploaded successfully', 201);
  } catch (err) {
    console.error('[Prescriptions] Upload error:', err);
    return errorResponse(res, 'Failed to upload prescription', 500);
  }
};

/**
 * GET /prescriptions/:appointmentId
 * Get all prescriptions for a given appointment
 */
const getPrescriptionsByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Access check: only doctor or patient of this appointment, or admin
    if (
      appointment.doctor_id !== req.user.id &&
      appointment.patient_id !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return errorResponse(res, 'Access denied', 403);
    }

    const prescriptions = await Prescription.findAll({
      where: { appointment_id: appointmentId },
      order: [['created_at', 'DESC']],
    });

    const prescriptionsWithSignedUrls = await Promise.all(
      prescriptions.map(async (rx) => {
        const rxJson = rx.toJSON();
        if (rx.file_key) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: rx.file_key,
            });
            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            rxJson.file_url = signedUrl;
          } catch (error) {
            console.error('[Prescriptions] Error generating signed URL:', error);
          }
        }
        return rxJson;
      })
    );

    return successResponse(res, prescriptionsWithSignedUrls);
  } catch (err) {
    console.error('[Prescriptions] Get error:', err);
    return errorResponse(res, 'Failed to fetch prescriptions', 500);
  }
};

module.exports = {
  uploadPrescription,
  getPrescriptionsByAppointment,
  uploadPrescriptionValidators,
  generatePrescription,
};
