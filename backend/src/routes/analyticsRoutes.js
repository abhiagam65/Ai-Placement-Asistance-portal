import express from 'express';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', authenticate, getAnalyticsOverview);

export default router;
