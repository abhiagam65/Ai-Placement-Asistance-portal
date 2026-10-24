import express from 'express';
import {
  getAdminStats,
  getStudentsList,
  getAdminCompanies,
  createCompany,
  getAdminJobs,
  createJob,
  getAdminApplications,
  updateApplicationStatus,
  addAptitudeQuestion,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Require both valid JWT and admin role for all routes in this router
router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/students', getStudentsList);
router.get('/companies', getAdminCompanies);
router.post('/companies', createCompany);
router.get('/jobs', getAdminJobs);
router.post('/jobs', createJob);
router.get('/applications', getAdminApplications);
router.patch('/applications/:id/status', updateApplicationStatus);
router.post('/questions', addAptitudeQuestion);
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

export default router;
