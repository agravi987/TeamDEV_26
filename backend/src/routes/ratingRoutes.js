const express = require('express');
const router = express.Router();
const { submitRating, getDoctorRatings, getMyRating, submitRatingValidators } = require('../controllers/ratingController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};

// POST /ratings – patients only
router.post('/', authenticate, authorize('patient'), submitRatingValidators, validate, submitRating);

// GET /ratings/doctor/:doctorId – public
router.get('/doctor/:doctorId', getDoctorRatings);

// GET /ratings/my-rating/:appointmentId – patients only
router.get('/my-rating/:appointmentId', authenticate, authorize('patient'), getMyRating);

module.exports = router;
