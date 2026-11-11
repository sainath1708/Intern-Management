import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import internRoutes from './internRoutes.js';
import taskRoutes from './taskRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/interns', internRoutes);
router.use('/tasks', taskRoutes);
router.use('/submissions', submissionRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
