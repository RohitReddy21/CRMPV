import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      platformsHandled: [],
      active: true,
      totalAssignedLeads: 0,
    });
    await user.save();
    res.status(201).json({
      message: 'User created',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserAccess = async (req, res) => {
  try {
    const { userId, active, role } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (active !== undefined) user.active = active;
    if (role) user.role = role;
    await user.save();
    res.status(200).json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const updates = (({ name, email, platformsHandled }) => ({ name, email, platformsHandled }))(req.body);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ active: true });
    const admins = await User.countDocuments({ role: 'admin' });
    const agents = await User.countDocuments({ role: 'agent' });
    res.json({ total, active, admins, agents });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
