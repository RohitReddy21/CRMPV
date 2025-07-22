import { useState } from 'react';
import { loginUser } from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await loginUser(form);
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      toast.success('Login successful!');
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.message || res.error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-12">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-blue-100 rounded-full p-3 mb-2">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-blue-700">Sign In</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pl-10" />
          <span className="absolute left-3 top-2.5 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a2 2 0 01-2 2H10a2 2 0 01-2-2v-1" /></svg>
          </span>
        </div>
        <div className="relative">
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="input input-bordered w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pl-10" />
          <span className="absolute left-3 top-2.5 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0v2m0 4h.01" /></svg>
          </span>
        </div>
        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold">Login</button>
      </form>
      <div className="text-center mt-4 text-sm">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
      </div>
    </div>
  );
} 