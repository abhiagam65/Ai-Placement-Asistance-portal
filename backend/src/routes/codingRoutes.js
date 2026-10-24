import express from 'express';
import { getCodingProblems, getCodingProblemBySlug, runCodeSample, submitCode, getCodingSubmissions } from '../controllers/codingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/problems', authenticate, getCodingProblems);
router.get('/problems/:slug', authenticate, getCodingProblemBySlug);
router.post('/run', authenticate, runCodeSample);
router.post('/submit', authenticate, submitCode);
router.get('/submissions', authenticate, getCodingSubmissions);

export default router;
