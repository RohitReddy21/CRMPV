import { useEffect, useState } from 'react';
import { clockIn, clockOut, getAttendance, getCurrentUser, fetchAllUsers, deleteAttendance } from '../api';
import { toast } from 'react-toastify';

function groupAttendanceByDate(records) {
  // Group records by date string
  const grouped = {};
  records.forEach(r => {
    const dateStr = new Date(r.date).toLocaleDateString();
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(r);
  });
  return grouped;
}

function getMaxPairs(grouped) {
  // Find the max number of clock-in/out pairs for any day
  let max = 0;
  Object.values(grouped).forEach(records => {
    if (records.length > max) max = records.length;
  });
  return max;
}

export default function AttendancePage() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [summary, setSummary] = useState({ total: 0, clockedInToday: 0 });
  const token = localStorage.getItem('token');

  // Initial fetch: get user info and all users (for admin)
  useEffect(() => {
    async function fetchData() {
      try {
        const me = await getCurrentUser(token);
        setCurrentUser(me);
        if (me.role === 'admin') {
          setUsers(await fetchAllUsers(token));
        }
      } catch (err) {
        setError('Failed to fetch user data: ' + (err.message || err));
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Fetch attendance records (with filters for admin)
  useEffect(() => {
    async function fetchAttendance() {
      try {
        if (!currentUser) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (currentUser.role === 'admin') {
          const filtered = await getAttendance(token, userFilter, dateFilter);
          setRecords(filtered);
          // Summary stats
          const all = await getAttendance(token);
          const todayStr = today.toDateString();
          setSummary({
            total: all.length,
            clockedInToday: all.filter(r => new Date(r.date).toDateString() === todayStr && r.clockIn).length,
          });
        } else {
          // Agent: only fetch their own records
          const myRecords = await getAttendance(token);
          setRecords(myRecords);
        }
      } catch (err) {
        setError('Failed to fetch attendance data: ' + (err.message || err));
      }
    }
    fetchAttendance();
    // eslint-disable-next-line
  }, [currentUser, userFilter, dateFilter]);

  // Helper: get today's records for current user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();
  let todaysRecords = [];
  if (currentUser) {
    if (currentUser.role === 'admin' && userFilter) {
      // For admin, if filtering by user, show today's records for that user
      todaysRecords = records.filter(r => new Date(r.date).toDateString() === todayStr && r.user?._id === userFilter);
    } else if (currentUser.role === 'admin' && !userFilter) {
      // If not filtering by user, show all today's records
      todaysRecords = records.filter(r => new Date(r.date).toDateString() === todayStr);
    } else {
      // For agent, show their own today's records
      todaysRecords = records.filter(r => new Date(r.date).toDateString() === todayStr);
    }
  }
  // Determine if the user can clock in or clock out
  const lastToday = todaysRecords.length > 0 ? todaysRecords[todaysRecords.length - 1] : null;
  const canClockIn = !lastToday || (lastToday && lastToday.clockOut);
  const canClockOut = lastToday && lastToday.clockIn && !lastToday.clockOut;

  const handleClockIn = async () => {
    try {
      const res = await clockIn(token);
      if (res.message) toast.success(res.message);
      if (res.error) toast.error(res.error);
      window.location.reload();
    } catch (err) {
      toast.error('Clock in failed: ' + (err.message || err));
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await clockOut(token);
      if (res.message) toast.success(res.message);
      if (res.error) toast.error(res.error);
      window.location.reload();
    } catch (err) {
      toast.error('Clock out failed: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteAttendance(token, id);
    if (res.message) toast.success(res.message);
    if (res.error) toast.error(res.error);
    // Refetch records
    if (currentUser.role === 'admin') {
      const filtered = await getAttendance(token, userFilter, dateFilter);
      setRecords(filtered);
    }
  };

  // Grouped view for single user (agent, or admin with userFilter)
  let grouped = {};
  let maxPairs = 0;
  if (currentUser) {
    if (currentUser.role === 'admin' && userFilter) {
      // Admin viewing a single user
      grouped = groupAttendanceByDate(records);
      maxPairs = getMaxPairs(grouped);
    } else if (currentUser.role !== 'admin') {
      // Agent
      grouped = groupAttendanceByDate(records);
      maxPairs = getMaxPairs(grouped);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Attendance</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Today's Status</h2>
        {todaysRecords.length === 0 ? (
          <div>Not clocked in today.</div>
        ) : (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-blue-100">
                  {currentUser?.role === 'admin' && !userFilter && <th className="py-2 px-3 border">Employee</th>}
                  <th className="py-2 px-3 border">Clock In</th>
                  <th className="py-2 px-3 border">Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {todaysRecords.map(r => (
                  <tr key={r._id} className="even:bg-gray-50">
                    {currentUser?.role === 'admin' && !userFilter && <td className="py-1 px-3 border">{r.user?.name || '-'}</td>}
                    <td className="py-1 px-3 border">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                    <td className="py-1 px-3 border">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-4 mt-4">
          {canClockIn && <button onClick={handleClockIn} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Clock In</button>}
          {canClockOut && <button onClick={handleClockOut} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Clock Out</button>}
        </div>
      </div>
      {/* Grouped table for agent or admin viewing a single user */}
      {(currentUser?.role !== 'admin' || (currentUser?.role === 'admin' && userFilter)) ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-3 border">Date</th>
                  {Array.from({ length: maxPairs }).map((_, i) => [
                    <th key={`in${i}`} className="py-2 px-3 border">Clock In {i + 1}</th>,
                    <th key={`out${i}`} className="py-2 px-3 border">Clock Out {i + 1}</th>
                  ])}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).length === 0 ? (
                  <tr><td colSpan={1 + maxPairs * 2} className="text-center py-4">No records found.</td></tr>
                ) : Object.entries(grouped).map(([date, recs]) => (
                  <tr key={date} className="even:bg-gray-50">
                    <td className="py-1 px-3 border">{date}</td>
                    {Array.from({ length: maxPairs }).map((_, i) => [
                      <td key={`in${i}`} className="py-1 px-3 border">{recs[i]?.clockIn ? new Date(recs[i].clockIn).toLocaleTimeString() : '-'}</td>,
                      <td key={`out${i}`} className="py-1 px-3 border">{recs[i]?.clockOut ? new Date(recs[i].clockOut).toLocaleTimeString() : '-'}</td>
                    ])}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Attendance Records</h2>
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="font-semibold">Summary:</div>
            <div>Total Records: {summary.total}</div>
            <div>Clocked In Today: {summary.clockedInToday}</div>
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="input input-bordered px-2 py-1 border rounded">
              <option value="">All Employees</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input input-bordered px-2 py-1 border rounded" />
            <button onClick={() => { setUserFilter(''); setDateFilter(''); }} className="text-blue-600 hover:underline text-sm">Clear Filters</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-3 border">Employee</th>
                  <th className="py-2 px-3 border">Date</th>
                  <th className="py-2 px-3 border">Clock In</th>
                  <th className="py-2 px-3 border">Clock Out</th>
                  <th className="py-2 px-3 border">Delete</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4">No records found.</td></tr>
                ) : records.map(r => (
                  <tr key={r._id} className="even:bg-gray-50">
                    <td className="py-1 px-3 border">{r.user?.name || '-'}</td>
                    <td className="py-1 px-3 border">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-1 px-3 border">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                    <td className="py-1 px-3 border">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                    <td className="py-1 px-3 border">
                      <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:underline ml-2">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 