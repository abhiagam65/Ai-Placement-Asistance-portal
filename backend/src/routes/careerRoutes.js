import express from 'express';
import { getCareerGuidance } from '../controllers/careerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/roadmap', authenticate, getCareerGuidance);

export default router;
