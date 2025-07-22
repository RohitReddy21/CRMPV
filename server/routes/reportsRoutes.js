import express from 'express';
import { attendanceReport, leadsReport, salesReport } from '../controllers/reportsController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/attendance', authMiddleware, adminMiddleware, attendanceReport);
router.get('/leads', authMiddleware, adminMiddleware, leadsReport);
router.get('/sales', authMiddleware, adminMiddleware, salesReport);

export default router; 