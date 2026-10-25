import express from 'express';
import multer from 'multer';
import {
  analyzeResume,
  getResumeHistory,
  getResumeById,
  supportedResumeType,
  RESUME_MAX_BYTES
} from '../controllers/resumeController.js';
import { authenticate } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: RESUME_MAX_BYTES,
    files: 1,
    fields: 2,
    parts: 4,
    fieldSize: 120000,
    fieldNameSize: 50
  },
  fileFilter: (req, file, callback) => {
    if (supportedResumeType(file)) return callback(null, true);
    return callback(Object.assign(new Error('Unsupported resume format. Upload a PDF or UTF-8 TXT file.'), { code: 'UNSUPPORTED_RESUME_FORMAT' }));
  }
}).single('resume');

// Keep multipart failures local so upload errors receive useful client statuses.
export const uploadResume = (req, res, next) => upload(req, res, error => {
  if (!error) return next();
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Resume file exceeds the 5 MB limit.' });
  }
  if (error.code === 'LIMIT_FIELD_VALUE') {
    return res.status(413).json({ success: false, message: 'Resume text or job description exceeds the upload field limit.' });
  }
  if (['LIMIT_UNEXPECTED_FILE', 'LIMIT_FILE_COUNT'].includes(error.code)) {
    return res.status(400).json({ success: false, message: 'Upload exactly one resume file in the resume field.' });
  }
  if (error.code === 'UNSUPPORTED_RESUME_FORMAT') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(400).json({ success: false, message: 'The upload could not be read. Include one PDF or UTF-8 TXT file and the optional job description.' });
});

const router = express.Router();
router.post('/upload', authenticate, uploadResume, analyzeResume);
router.get('/history', authenticate, getResumeHistory);
router.get('/:id', authenticate, getResumeById);

export default router;
