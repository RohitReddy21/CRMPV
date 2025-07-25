import { useEffect, useState } from 'react';
import { getCurrentUser, updateCurrentUser, getAllUsers, getUserStats, getLeads, getAttendance } from '../api';
import { FaUsers, FaUserCheck, FaClipboardList, FaChartBar, FaUserTie } from 'react-icons/fa';
import logo from '../assets/primeverse-logo.png';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', platformsHandled: '' });
  const [message, setMessage] = useState('');
  const [leadCount, setLeadCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [leads, setLeads] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      const u = await getCurrentUser(token);
      setUser(u);
      setForm({ name: u.name || '', email: u.email || '', platformsHandled: (u.platformsHandled || []).join(', ') });
      if (u.role === 'admin') {
        setUsers(await getAllUsers(token));
        setStats(await getUserStats(token));
        const leadsData = await getLeads(token);
        setLeads(leadsData);
        setLeadCount(leadsData.length);
        const attendanceData = await getAttendance(token);
        setAttendance(attendanceData);
        setAttendanceCount(attendanceData.length);
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  // --- Recent Activity ---
  const recentLeads = leads.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentAttendance = attendance.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  // --- Leads Breakdown Pie Chart ---
  const platformColors = {
    linkedin: '#0077b5',
    meta: '#4267B2',
    google: '#ea4335',
    website: '#34a853',
  };
  const leadsByPlatform = [
    { name: 'LinkedIn', value: leads.filter(l => l.platform === 'linkedin').length, color: platformColors.linkedin },
    { name: 'Meta', value: leads.filter(l => l.platform === 'meta').length, color: platformColors.meta },
    { name: 'Google', value: leads.filter(l => l.platform === 'google').length, color: platformColors.google },
    { name: 'Website', value: leads.filter(l => l.platform === 'website').length, color: platformColors.website },
  ];

  // --- Lead Status Pie Chart ---
  const statusColors = {
    new: '#a3e635',
    contacted: '#fbbf24',
    inprogress: '#818cf8',
    converted: '#22d3ee',
    lost: '#f87171',
  };
  const leadStatusData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length, color: statusColors.new },
    { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: statusColors.contacted },
    { name: 'In Progress', value: leads.filter(l => l.status === 'inprogress').length, color: statusColors.inprogress },
    { name: 'Converted', value: leads.filter(l => l.status === 'converted').length, color: statusColors.converted },
    { name: 'Lost', value: leads.filter(l => l.status === 'lost').length, color: statusColors.lost },
  ];

  // --- Sales Progress Bar Chart ---
  const salesBarData = [
    { status: 'New', value: leads.filter(l => l.status === 'new').length },
    { status: 'Contacted', value: leads.filter(l => l.status === 'contacted').length },
    { status: 'In Progress', value: leads.filter(l => l.status === 'inprogress').length },
    { status: 'Converted', value: leads.filter(l => l.status === 'converted').length },
    { status: 'Lost', value: leads.filter(l => l.status === 'lost').length },
  ];

  // --- Attendance Summary ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const clockedInToday = attendance.filter(a => a.clockIn && new Date(a.clockIn).toDateString() === today.toDateString());
  const userToday = user && attendance.filter(a => a.user?._id === user._id && new Date(a.clockIn).toDateString() === today.toDateString());

  // --- Reports Preview (placeholder) ---
  const reportsData = [
    { name: 'Attendance', value: attendanceCount },
    { name: 'Leads', value: leadCount },
    { name: 'Sales', value: 12 },
  ];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async e => {
    e.preventDefault();
    const updates = { ...form, platformsHandled: form.platformsHandled.split(',').map(s => s.trim()).filter(Boolean) };
    const res = await updateCurrentUser(token, updates);
    setMessage(res.message || res.error);
    if (res.user) setUser(res.user);
    setEdit(false);
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen w-full flex bg-[#0a2342]">
      {/* Sidebar */}
      
      {/* Main Content */}
      <main className="flex-1 min-h-screen bg-[#f7fafd] flex flex-col items-center">
        <div className="max-w-6xl w-full mt-12 p-8 bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-center mb-10 animate-fade-in-down">
            <span className="text-4xl font-extrabold text-[#0a2342] tracking-tight select-none">Dashboard</span>
          </div>
        {/* Overview Cards */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="flex flex-col items-center bg-gradient-to-br from-[#2ec4f1] to-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-all duration-200 animate-fade-in-up">
              <FaUsers className="text-4xl text-[#0a2342] mb-2" />
              <div className="text-2xl font-bold text-[#0a2342]">{stats ? stats.total : '--'}</div>
              <div className="text-[#4b5e6b]">Total Users</div>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-[#ffd600] to-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-all duration-200 animate-fade-in-up">
              <FaClipboardList className="text-4xl text-[#ffd600] mb-2" />
              <div className="text-2xl font-bold text-[#0a2342]">{leadCount}</div>
              <div className="text-[#4b5e6b]">Total Leads</div>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-[#2ec4f1] to-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-all duration-200 animate-fade-in-up">
              <FaUserCheck className="text-4xl text-[#2ec4f1] mb-2" />
              <div className="text-2xl font-bold text-[#0a2342]">{attendanceCount}</div>
              <div className="text-[#4b5e6b]">Attendance Records</div>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-[#0a2342] to-white rounded-2xl shadow-lg p-6 hover:scale-105 transition-all duration-200 animate-fade-in-up">
              <FaChartBar className="text-4xl text-[#0a2342] mb-2" />
              <div className="text-2xl font-bold text-[#ffd600]">4</div>
              <div className="text-[#4b5e6b]">Reports</div>
            </div>
          </div>
        )}
        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 mb-10 justify-center animate-fade-in-up">
          <Link to="/leads" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Leads</Link>
          <Link to="/attendance" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Attendance</Link>
          <Link to="/reports/sales" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Sales</Link>
        </div>
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h2>
            <div className="mb-2 font-semibold text-gray-700">Leads</div>
            <ul className="mb-4">
              {recentLeads.length === 0 ? <li className="text-gray-500">No recent leads.</li> : recentLeads.map(l => (
                <li key={l._id} className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-blue-700">{l.name}</span>
                  <span className="text-xs text-gray-500">({l.platform})</span>
                  <span className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2 font-semibold text-gray-700">Attendance</div>
            <ul>
              {recentAttendance.length === 0 ? <li className="text-gray-500">No recent attendance.</li> : recentAttendance.map(a => (
                <li key={a._id} className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-green-700">{a.user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">{a.clockIn ? 'Clocked In' : ''}{a.clockOut ? ' / Clocked Out' : ''}</span>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Leads Breakdown Pie Chart */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-6 animate-fade-in-up flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Leads Breakdown by Platform</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={leadsByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {leadsByPlatform.map((entry, idx) => (
                    <Cell key={`cell-platform-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <h2 className="text-xl font-bold mb-4 text-gray-800 mt-8">Leads Breakdown by Status</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={leadStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {leadStatusData.map((entry, idx) => (
                    <Cell key={`cell-status-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Attendance Summary */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Attendance Summary</h2>
            <div className="mb-2 font-semibold text-gray-700">Clocked In Today</div>
            <ul className="mb-4">
              {clockedInToday.length === 0 ? <li className="text-gray-500">No one clocked in today.</li> : clockedInToday.map(a => (
                <li key={a._id} className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-green-700">{a.user?.name || 'User'}</span>
                  <span className="text-xs text-gray-400">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : ''}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2 font-semibold text-gray-700">Your Today</div>
            <ul>
              {userToday && userToday.length === 0 ? <li className="text-gray-500">No attendance today.</li> : userToday && userToday.map(a => (
                <li key={a._id} className="mb-1 flex items-center gap-2">
                  <span className="font-bold text-blue-700">{a.clockIn ? 'Clock In' : ''}{a.clockOut ? ' / Clock Out' : ''}</span>
                  <span className="text-xs text-gray-400">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : ''}</span>
                  <span className="text-xs text-gray-400">{a.clockOut ? ' - ' + new Date(a.clockOut).toLocaleTimeString() : ''}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Reports Preview (Bar Chart) */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-6 animate-fade-in-up flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Reports Preview</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reportsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Sales Status Summary (Bar Chart) */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 animate-fade-in-up flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Sales Progress</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesBarData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#818cf8" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Profile Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Your Profile</h2>
          {edit ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-3 mb-2">
              <input name="name" value={form.name} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded" />
              <input name="email" value={form.email} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded" />
              <input name="platformsHandled" value={form.platformsHandled} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded" placeholder="Platforms (comma separated)" />
              <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Save</button>
            </form>
          ) : (
            <div className="mb-2">
              <div><b>Name:</b> {user.name}</div>
              <div><b>Email:</b> {user.email}</div>
              <div><b>Role:</b> {user.role}</div>
              <div><b>Platforms:</b> {(user.platformsHandled || []).join(', ')}</div>
            </div>
          )}
          <button onClick={() => setEdit(e => !e)} className="text-blue-600 hover:underline text-sm mb-2">{edit ? 'Cancel' : 'Edit Profile'}</button>
          {message && <div className="text-sm text-green-600 mb-2">{message}</div>}
        </div>
        {/* Admin: User Stats and All Users Table */}
        {user.role === 'admin' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">User Stats</h2>
              {stats ? (
                <ul className="list-disc ml-6">
                  <li>Total users: {stats.total}</li>
                  <li>Active users: {stats.active}</li>
                  <li>Admins: {stats.admins}</li>
                  <li>Agents: {stats.agents}</li>
                </ul>
              ) : 'Loading stats...'}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">All Users</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="py-2 px-3 border">Name</th>
                      <th className="py-2 px-3 border">Email</th>
                      <th className="py-2 px-3 border">Role</th>
                      <th className="py-2 px-3 border">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="even:bg-gray-50">
                        <td className="py-1 px-3 border">{u.name}</td>
                        <td className="py-1 px-3 border">{u.email}</td>
                        <td className="py-1 px-3 border">{u.role}</td>
                        <td className="py-1 px-3 border">{u.active ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}