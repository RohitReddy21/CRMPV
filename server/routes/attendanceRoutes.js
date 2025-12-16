import express from 'express';
import { clockIn, clockOut, getAttendance, deleteAttendance } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/clockin', authMiddleware, clockIn);
router.post('/clockout', authMiddleware, clockOut);
router.get('/attendance', authMiddleware, getAttendance);
router.delete('/:id', authMiddleware, deleteAttendance);

export default router; 