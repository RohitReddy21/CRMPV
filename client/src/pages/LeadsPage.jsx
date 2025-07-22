import { useEffect, useState } from 'react';
import { addLead, getLeads, updateLead, deleteLead, fetchAllUsers, getCurrentUser } from '../api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { FaEdit, FaTimes } from 'react-icons/fa';

const platforms = [
  { value: '', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
];

const statuses = [
  'new', 'contacted', 'converted', 'lost'
];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', platform: '', notes: '' });
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null); // Track which row is being edited
  const token = localStorage.getItem('token');

  const fetchLeads = async (platform) => {
    setLoading(true);
    setLeads(await getLeads(token, platform));
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads(platformFilter);
    // eslint-disable-next-line
  }, [platformFilter]);

  useEffect(() => {
    async function fetchUsersAndMe() {
      setUsers(await fetchAllUsers(token));
      setCurrentUser(await getCurrentUser(token));
    }
    fetchUsersAndMe();
    // eslint-disable-next-line
  }, []);

  // Socket.IO: Listen for leadAssigned and refetch leads
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.emit('identify', user._id);
    socket.on('leadAssigned', (data) => {
      toast.info(data.message, { autoClose: 4000 });
      fetchLeads(platformFilter);
    });
    return () => socket.disconnect();
    // eslint-disable-next-line
  }, [platformFilter]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.platform) {
      toast.error('Name and platform are required');
      return;
    }
    const res = await addLead(token, form);
    if (res.lead) {
      toast.success(res.message);
      setForm({ name: '', contact: '', platform: '', notes: '' });
      fetchLeads(platformFilter);
    } else {
      toast.error(res.message || res.error);
    }
  };

  const handleUpdate = async (id, updates) => {
    const res = await updateLead(token, id, updates);
    if (res.lead) toast.success(res.message);
    if (res.error) toast.error(res.error);
    fetchLeads(platformFilter);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    const res = await deleteLead(token, id);
    if (res.message) toast.success(res.message);
    if (res.error) toast.error(res.error);
    fetchLeads(platformFilter);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Leads</h1>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
        <input name="name" placeholder="Lead Name" value={form.name} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded w-full" />
        <input name="contact" placeholder="Contact Info" value={form.contact} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded w-full" />
        <select name="platform" value={form.platform} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded w-full">
          <option value="">Select Platform</option>
          {platforms.filter(p => p.value).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold">Add Lead</button>
      </form>
      <div className="flex items-center gap-2 mb-4">
        <label className="font-semibold">Filter by Platform:</label>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="input input-bordered px-3 py-2 border rounded">
          {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="py-2 px-3 border">Name</th>
              <th className="py-2 px-3 border">Contact</th>
              <th className="py-2 px-3 border">Platform</th>
              <th className="py-2 px-3 border">Status</th>
              <th className="py-2 px-3 border">Status Note</th>
              <th className="py-2 px-3 border">Active</th>
              <th className="py-2 px-3 border">Assigned To</th>
              <th className="py-2 px-3 border">Notes</th>
              <th className="py-2 px-3 border">Created</th>
              <th className="py-2 px-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-4">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-4">No leads found.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead._id} className="even:bg-gray-50">
                <td className="py-1 px-3 border">{lead.name}</td>
                <td className="py-1 px-3 border">{lead.contact}</td>
                <td className="py-1 px-3 border capitalize">{lead.platform}</td>
                <td className="py-1 px-3 border capitalize">
                  <select value={lead.status} onChange={e => handleUpdate(lead._id, { status: e.target.value })} className="input input-bordered px-2 py-1 border rounded">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="py-1 px-3 border">
                  <input value={lead.statusNote || ''} onChange={e => handleUpdate(lead._id, { statusNote: e.target.value })} className="input input-bordered px-2 py-1 border rounded" placeholder="Status note" />
                </td>
                <td className="py-1 px-3 border">
                  <input type="checkbox" checked={lead.active} onChange={e => handleUpdate(lead._id, { active: e.target.checked })} />
                </td>
                <td className="py-1 px-3 border">
                  {editingAssignment === lead._id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.assignedTo?._id || ''}
                        onChange={e => handleUpdate(lead._id, { assignedTo: e.target.value })}
                        className="input input-bordered px-2 py-1 border rounded w-40"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          className="text-gray-500 hover:text-red-600 text-lg"
                          onClick={() => setEditingAssignment(null)}
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {lead.assignedTo && typeof lead.assignedTo === 'object' && lead.assignedTo.name ? (
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                          {lead.assignedTo.name} <span className="text-gray-500 font-normal">({lead.assignedTo.role})</span>
                        </span>
                      ) : (
                        <span className="inline-block bg-gray-100 text-gray-500 px-2 py-0.5 rounded italic">Unassigned</span>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          className="ml-1 text-blue-600 hover:text-blue-900 text-lg"
                          onClick={() => setEditingAssignment(lead._id)}
                          title="Edit assignment"
                        >
                          <FaEdit />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-1 px-3 border">{lead.notes}</td>
                <td className="py-1 px-3 border">{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td className="py-1 px-3 border">
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => handleDelete(lead._id)} className="text-red-600 hover:underline">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 