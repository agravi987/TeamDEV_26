const express = require('express');
const router = express.Router();
const { createVideoSession, videoSessionValidators } = require('../controllers/videoSessionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');

// POST /video-session
router.post('/', authenticate, videoSessionValidators, validate, createVideoSession);

module.exports = router;
