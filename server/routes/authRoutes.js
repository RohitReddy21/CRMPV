// ...existing code...

import express from 'express';
import { registerUser, loginUser, updateUserAccess, getCurrentUser, updateCurrentUser, getAllUsers, getUserStats } from '../controllers/authController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

import User from '../models/User.js';


const router = express.Router();
// GET /api/auth/users (for chat user list, no admin required)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/user/access', authMiddleware, adminMiddleware, updateUserAccess);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/me', authMiddleware, updateCurrentUser);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.get('/stats', authMiddleware, adminMiddleware, getUserStats);

export default router;
