import { useState } from 'react';
import { registerUser } from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await registerUser(form);
    if (res.message === 'User created') {
      toast.success(res.message);
      setForm({ name: '', email: '', password: '', role: 'agent' });
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message || res.error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-12">
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-2 text-center">Register</h2>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select name="role" value={form.role} onChange={handleChange} className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold">Register</button>
      </form>
      <div className="text-center mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
      </div>
    </div>
  );
} 