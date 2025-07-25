import express from 'express';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import authMiddleware from '../middleware/authMiddleware.js';
// import chatRoutes from './routes/chat.js';

const router = express.Router();

// Add users to a group
router.post('/groups/:groupId/add', authMiddleware, async (req, res) => {
  try {
    const { userIds } = req.body; // array of user IDs
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array required' });
    }
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $addToSet: { members: { $each: userIds } } },
      { new: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add users to group' });
  }
});

// Get all groups
router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create a new group
router.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });
    const group = new Group({ name, members: [req.user._id] });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get group chat history
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  const groupId = req.params.groupId;
  try {
    let messages = await Message.find({ receiver: groupId, receiverModel: 'Group' }).sort({ timestamp: 1 });
    messages = messages.map(msg => msg.toObject());
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Get chat history between two users
router.get('/:userId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.userId;
  try {
    let messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    }).sort({ timestamp: 1 });
    messages = messages.map(msg => msg.toObject());
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;