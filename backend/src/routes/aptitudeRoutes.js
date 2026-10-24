import express from 'express';
import { getAptitudeCategories, getAptitudeQuiz, submitAptitudeQuiz, getAptitudeHistory } from '../controllers/aptitudeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', authenticate, getAptitudeCategories);
router.get('/quiz', authenticate, getAptitudeQuiz);
router.post('/submit', authenticate, submitAptitudeQuiz);
router.get('/history', authenticate, getAptitudeHistory);

export default router;
