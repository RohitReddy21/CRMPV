import Attendance from '../models/Attendance.js';

export const clockIn = async (req, res) => {
  try {
    // Always allow a new clock-in
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = new Attendance({
      user: req.user._id,
      clockIn: now,
      date: today,
    });
    await attendance.save();
    res.status(201).json({ message: 'Clocked in', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    // Find the most recent clock-in without a clock-out for this user
    const attendance = await Attendance.findOne({
      user: req.user._id,
      clockOut: null,
    }).sort({ clockIn: -1 });
    if (!attendance) {
      return res.status(400).json({ message: 'No active clock-in found' });
    }
    attendance.clockOut = new Date();
    await attendance.save();
    res.json({ message: 'Clocked out', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user._id; // Agents can only see their own records
    } else if (req.query.user) {
      filter.user = req.query.user;
    }
    if (req.query.date) filter.date = new Date(req.query.date);
    const records = await Attendance.find(filter).populate('user', 'name email role');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};