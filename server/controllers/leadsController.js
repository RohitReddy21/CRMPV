import Lead from '../models/Lead.js';

export const addLead = async (req, res) => {
  try {
    const { name, contact, platform, status, assignedTo, notes, statusNote, active } = req.body;
    const lead = new Lead({ name, contact, platform, status, assignedTo, notes, statusNote, active });
    await lead.save();
    // Notify assigned user if connected
    if (assignedTo) {
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const socketId = connectedUsers.get(assignedTo);
      if (io && socketId) {
        io.to(socketId).emit('leadAssigned', {
          message: 'A new lead has been assigned to you.',
          lead,
        });
      }
    }
    res.status(201).json({ message: 'Lead added', lead });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLeads = async (req, res) => {
  try {
    const filter = {};
    if (req.query.platform) filter.platform = req.query.platform;
    const leads = await Lead.find(filter).populate('assignedTo', 'name email role');
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const updateFields = (({ name, contact, platform, status, assignedTo, notes, statusNote, active }) => ({ name, contact, platform, status, assignedTo, notes, statusNote, active }))(req.body);
    const lead = await Lead.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    // Notify assigned user if connected and assignedTo is present
    if (updateFields.assignedTo) {
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const socketId = connectedUsers.get(updateFields.assignedTo);
      if (io && socketId) {
        io.to(socketId).emit('leadAssigned', {
          message: 'A lead has been assigned to you.',
          lead,
        });
      }
    }
    res.json({ message: 'Lead updated', lead });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 