const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: PDF, JPEG, PNG`),
      false
    );
  }
};

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        uploadedBy: req.user ? req.user.id : 'unknown',
      });
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueKey = `prescriptions/${uuidv4()}${ext}`;
      cb(null, uniqueKey);
    },
    acl: 'private', // Files are private, accessed via signed URLs if needed
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { upload };
