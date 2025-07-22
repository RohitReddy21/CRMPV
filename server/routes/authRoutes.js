import express from 'express';
import { registerUser, loginUser, updateUserAccess, getCurrentUser, updateCurrentUser, getAllUsers, getUserStats } from '../controllers/authController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/user/access', authMiddleware, adminMiddleware, updateUserAccess);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, updateCurrentUser);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.get('/stats', authMiddleware, adminMiddleware, getUserStats);

export default router;
