import { useEffect, useState } from 'react';
import { registerUser, fetchAllUsers, getCurrentUser } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AdminRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const me = await getCurrentUser(token);
      setCurrentUser(me);
      setUsers(await fetchAllUsers(token));
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
    // eslint-disable-next-line
  }, [currentUser]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await registerUser(form);
    if (res.message === 'User created') {
      toast.success(res.message);
      setForm({ name: '', email: '', password: '', role: 'agent' });
      setUsers(await fetchAllUsers(token));
    } else {
      toast.error(res.message || res.error);
    }
  };

  if (!currentUser) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Admin: Register New User</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" className="input input-bordered px-3 py-2 border rounded" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded" />
        <select name="role" value={form.role} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded">
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold">Register User</button>
      </form>
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
            {users.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4">No users found.</td></tr>
            ) : users.map(u => (
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
  );
} 