import express from 'express';
import { getJobs, getJobById, applyToJob, getMyApplications } from '../controllers/jobController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getJobs);
router.get('/my-applications', authenticate, getMyApplications);
router.get('/:id', authenticate, getJobById);
router.post('/:id/apply', authenticate, applyToJob);

export default router;
