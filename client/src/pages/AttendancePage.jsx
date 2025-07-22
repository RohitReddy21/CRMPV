import { useEffect, useState } from 'react';
import { clockIn, clockOut, getAttendance, getCurrentUser, fetchAllUsers, deleteAttendance } from '../api';
import { toast } from 'react-toastify';

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
          const todayRecord = all.find(r => r.user._id === currentUser._id && new Date(r.date).toDateString() === today.toDateString());
          setStatus(todayRecord);
        } else {
          // Agent: only fetch their own records
          const myRecords = await getAttendance(token);
          setRecords(myRecords);
          // Find today's record
          const todayRecord = myRecords.find(r => new Date(r.date).toDateString() === today.toDateString());
          setStatus(todayRecord);
        }
      } catch (err) {
        setError('Failed to fetch attendance data: ' + (err.message || err));
      }
    }
    fetchAttendance();
    // eslint-disable-next-line
  }, [currentUser, userFilter, dateFilter]);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Attendance</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Today's Status</h2>
        {status ? (
          <div>
            <div><b>Clock In:</b> {status.clockIn ? new Date(status.clockIn).toLocaleTimeString() : '-'}</div>
            <div><b>Clock Out:</b> {status.clockOut ? new Date(status.clockOut).toLocaleTimeString() : '-'}</div>
          </div>
        ) : (
          <div>Not clocked in today.</div>
        )}
        <div className="flex gap-4 mt-4">
          {!status?.clockIn && <button onClick={handleClockIn} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Clock In</button>}
          {status?.clockIn && !status?.clockOut && <button onClick={handleClockOut} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Clock Out</button>}
        </div>
      </div>
      {currentUser?.role === 'admin' ? (
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
                  <tr><td colSpan={4} className="text-center py-4">No records found.</td></tr>
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
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-3 border">Date</th>
                  <th className="py-2 px-3 border">Clock In</th>
                  <th className="py-2 px-3 border">Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-4">No records found.</td></tr>
                ) : records.map(r => (
                  <tr key={r._id} className="even:bg-gray-50">
                    <td className="py-1 px-3 border">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-1 px-3 border">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                    <td className="py-1 px-3 border">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
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