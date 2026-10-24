import express from 'express';
import multer from 'multer';
import { analyzeResume, getResumeHistory, getResumeById } from '../controllers/resumeController.js';
import { authenticate } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.txt') || file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOCX, and TXT files are accepted.'), false);
    }
  }
});

const router = express.Router();

router.post('/upload', authenticate, upload.single('resume'), analyzeResume);
router.get('/history', authenticate, getResumeHistory);
router.get('/:id', authenticate, getResumeById);

export default router;
