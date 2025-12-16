import { useEffect, useState } from 'react';
import { getCurrentUser, updateCurrentUser, getAllUsers, getUserStats, getLeads, getAttendance } from '../api';
import { FaUsers, FaUserCheck, FaClipboardList, FaChartBar, FaUserTie } from 'react-icons/fa';
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
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-animated p-2 md:p-6">
      <div className="max-w-7xl w-full mt-4 md:mt-8 p-4 md:p-8 glass-panel rounded-3xl shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 drop-shadow-sm tracking-tight animate-fade-in-down text-center">
          Admin Dashboard
        </h1>
        {/* Overview Cards */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 perspective-1000">
            <div className="flex flex-col items-center bg-white/60 backdrop-blur rounded-2xl shadow-xl p-8 card-3d-hover border border-white/50 group">
              <FaUsers className="text-5xl text-blue-500 mb-4 animate-float group-hover:first-line:text-blue-600 transition-colors" />
              <div className="text-4xl font-black text-gray-800 mb-1">{stats ? stats.total : '--'}</div>
              <div className="text-gray-500 font-medium uppercase tracking-wider text-sm">Total Users</div>
            </div>
            <div className="flex flex-col items-center bg-white/60 backdrop-blur rounded-2xl shadow-xl p-8 card-3d-hover border border-white/50 group">
              <FaClipboardList className="text-5xl text-purple-500 mb-4 animate-float-delayed group-hover:text-purple-600 transition-colors" />
              <div className="text-4xl font-black text-gray-800 mb-1">{leadCount}</div>
              <div className="text-gray-500 font-medium uppercase tracking-wider text-sm">Total Leads</div>
            </div>
            <div className="flex flex-col items-center bg-white/60 backdrop-blur rounded-2xl shadow-xl p-8 card-3d-hover border border-white/50 group">
              <FaUserCheck className="text-5xl text-green-500 mb-4 animate-float group-hover:text-green-600 transition-colors" />
              <div className="text-4xl font-black text-gray-800 mb-1">{attendanceCount}</div>
              <div className="text-gray-500 font-medium uppercase tracking-wider text-sm">Attendance</div>
            </div>
            <div className="flex flex-col items-center bg-white/60 backdrop-blur rounded-2xl shadow-xl p-8 card-3d-hover border border-white/50 group">
              <FaChartBar className="text-5xl text-yellow-500 mb-4 animate-float-delayed group-hover:text-yellow-600 transition-colors" />
              <div className="text-4xl font-black text-gray-800 mb-1">4</div>
              <div className="text-gray-500 font-medium uppercase tracking-wider text-sm">Reports</div>
            </div>
          </div>
        )}
        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 mb-10 justify-center animate-fade-in-up">
          <Link to="/leads" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Leads</Link>
          <Link to="/attendance" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Attendance</Link>
          <Link to="/reports" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg shadow font-bold transition-all duration-150">Go to Reports</Link>
        </div>
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-lg p-8 card-3d-hover border border-white/40">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-blue-500">●</span> Recent Activity
            </h2>
            <div className="mb-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Leads</div>
            <ul className="mb-6 space-y-3">
              {recentLeads.length === 0 ? <li className="text-gray-500 italic">No recent leads.</li> : recentLeads.map(l => (
                <li key={l._id} className="flex items-center gap-3 bg-white/50 p-2 rounded-lg shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-bold text-gray-800">{l.name}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold uppercase">{l.platform}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(l.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
            <div className="mb-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Attendance</div>
            <ul className="space-y-3">
              {recentAttendance.length === 0 ? <li className="text-gray-500 italic">No recent attendance.</li> : recentAttendance.map(a => (
                <li key={a._id} className="flex items-center gap-3 bg-white/50 p-2 rounded-lg shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-bold text-gray-800">{a.user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500">{a.clockIn ? 'Clocked In' : ''}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Leads Breakdown Pie Chart */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-lg p-8 card-3d-hover border border-white/40 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Leads Breakdown</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={leadsByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>
                  {leadsByPlatform.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Attendance Summary */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-lg p-8 card-3d-hover border border-white/40">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Attendance Summary</h2>
            <div className="mb-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Clocked In Today</div>
            <ul className="mb-6 space-y-2">
              {clockedInToday.length === 0 ? <li className="text-gray-500 italic">No one clocked in today.</li> : clockedInToday.map(a => (
                <li key={a._id} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                    {a.user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{a.user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mb-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Your Today</div>
            <ul className="space-y-2">
              {userToday && userToday.length === 0 ? <li className="text-gray-500 italic">No attendance today.</li> : userToday && userToday.map(a => (
                <li key={a._id} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-800">Shift</span>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="text-gray-500 text-xs uppercase">In</div>
                      <div className="font-mono font-semibold">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString() : '--'}</div>
                    </div>
                    <div className="text-gray-300">→</div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs uppercase">Out</div>
                      <div className="font-mono font-semibold">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : '--'}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Reports Preview (Bar Chart) */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-lg p-8 card-3d-hover border border-white/40 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Reports Preview</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="url(#colorValue)" radius={[10, 10, 0, 0]} barSize={50} />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
    </div>
  );
} 