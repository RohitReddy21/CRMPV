import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent'], required: true },
  active: { type: Boolean, default: true },
  platformsHandled: [String],
  totalAssignedLeads: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
