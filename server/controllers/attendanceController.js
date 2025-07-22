import Attendance from '../models/Attendance.js';

export const clockIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const already = await Attendance.findOne({ user: req.user._id, date: today });
    if (already && already.clockIn) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }
    const attendance = new Attendance({ user: req.user._id, clockIn: new Date(), date: today });
    await attendance.save();
    res.status(201).json({ message: 'Clocked in', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance || attendance.clockOut) {
      return res.status(400).json({ message: 'Not clocked in or already clocked out' });
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