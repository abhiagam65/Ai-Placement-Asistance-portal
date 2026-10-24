import express from 'express';
import { startInterview, submitInterviewAnswer, getInterviewHistory, getInterviewSessionById } from '../controllers/interviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', authenticate, startInterview);
router.post('/:sessionId/answer', authenticate, submitInterviewAnswer);
router.get('/history', authenticate, getInterviewHistory);
router.get('/:sessionId', authenticate, getInterviewSessionById);

export default router;
