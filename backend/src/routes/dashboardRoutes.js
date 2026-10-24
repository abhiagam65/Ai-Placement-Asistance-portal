import express from 'express';
import { getStudentDashboardStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticate, getStudentDashboardStats);

export default router;
