import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  date: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema); 