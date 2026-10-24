import express from 'express';
import { getTasks, createTask, toggleTask, deleteTask } from '../controllers/studyPlannerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/tasks', authenticate, getTasks);
router.post('/tasks', authenticate, createTask);
router.patch('/tasks/:id/toggle', authenticate, toggleTask);
router.delete('/tasks/:id', authenticate, deleteTask);

export default router;
