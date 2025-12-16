import Lead from '../models/Lead.js';
import xlsx from 'xlsx';

export const addLead = async (req, res) => {
  try {
    const { name, contact, platform, status, assignedTo, notes, statusNote, active, value, priority } = req.body;
    const lead = new Lead({ name, contact, platform, status, assignedTo, notes, statusNote, active, value, priority });
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
    const updateFields = (({ name, contact, platform, status, assignedTo, notes, statusNote, active, value, priority }) => ({ name, contact, platform, status, assignedTo, notes, statusNote, active, value, priority }))(req.body);
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

export const bulkImportLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    let success = 0;
    let errors = [];
    for (const row of rows) {
      try {
        // Map Excel columns to Lead fields
        const leadData = {
          name: row.name || row.Name,
          contact: row.contact || row.Contact,
          platform: row.platform || row.Platform,
          status: row.status || row.Status || 'new',
          assignedTo: row.assignedTo || row.AssignedTo,
          notes: row.notes || row.Notes,
          statusNote: row.statusNote || row.StatusNote,
          active: row.active !== undefined ? row.active : true,
          value: row.value || row.Value || 0,
          priority: row.priority || row.Priority || 'Medium',
        };
        // Only add if name and platform are present
        if (!leadData.name || !leadData.platform) {
          errors.push({ row, error: 'Missing required fields (name, platform)' });
          continue;
        }
        const lead = new Lead(leadData);
        await lead.save();
        success++;
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }
    res.json({ message: `Imported ${success} leads`, success, errors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 