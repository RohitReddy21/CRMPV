import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  platform: { type: String, enum: ['linkedin', 'meta', 'google', 'website'], required: true },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'lost'], default: 'new' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  statusNote: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema); 