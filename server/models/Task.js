import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who owns this task
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }, // Optional link to a lead
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
