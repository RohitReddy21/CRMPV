import Attendance from '../models/Attendance.js';
import Lead from '../models/Lead.js';
// import Sale from '../models/Sale.js'; // Uncomment if you have a Sale model

// Helper to get date range
function getDateRange(range, month, year) {
  const now = new Date();
  let start, end;
  switch (range) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(end.getDate() + 1);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      if (month && year) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 1);
      } else if (year) {
        start = new Date(year, 0, 1);
        end = new Date(Number(year) + 1, 0, 1);
      } else {
        start = new Date(0);
        end = new Date();
      }
  }
  return { start, end };
}

export const attendanceReport = async (req, res) => {
  try {
    const { range, month, year } = req.query;
    const { start, end } = getDateRange(range, month, year);
    const match = { date: { $gte: start, $lt: end } };
    const data = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalClockIns: { $sum: { $cond: ['$clockIn', 1, 0] } },
          totalClockOuts: { $sum: { $cond: ['$clockOut', 1, 0] } },
          records: { $push: '$$ROOT' }
        }
      }
    ]);
    res.json(data[0] || { totalClockIns: 0, totalClockOuts: 0, records: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const leadsReport = async (req, res) => {
  try {
    const { range, month, year, platform, status } = req.query;
    const { start, end } = getDateRange(range, month, year);
    const match = { createdAt: { $gte: start, $lt: end } };
    if (platform) match.platform = platform;
    if (status) match.status = status;
    const data = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        }
      }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const salesReport = async (req, res) => {
  try {
    // Placeholder: implement aggregation for your Sale model
    res.json({ message: 'Sales report not implemented yet.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 