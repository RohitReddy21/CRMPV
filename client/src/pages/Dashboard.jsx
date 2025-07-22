import { useEffect, useState } from 'react';
import { getCurrentUser, updateCurrentUser, getAllUsers, getUserStats } from '../api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', platformsHandled: '' });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchData() {
      const u = await getCurrentUser(token);
      setUser(u);
      setForm({ name: u.name || '', email: u.email || '', platformsHandled: (u.platformsHandled || []).join(', ') });
      if (u.role === 'admin') {
        setUsers(await getAllUsers(token));
        setStats(await getUserStats(token));
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

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
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">Dashboard</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
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
      {user.role === 'admin' && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">User Stats</h2>
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
            <h2 className="text-xl font-semibold mb-2">All Users</h2>
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
  );
} 