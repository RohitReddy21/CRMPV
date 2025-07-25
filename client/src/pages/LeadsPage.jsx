import { useEffect, useState } from 'react';
import { addLead, getLeads, updateLead, deleteLead, fetchAllUsers, getCurrentUser } from '../api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { FaEdit, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const platforms = [
  { value: '', label: 'All Platforms' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
];

const statuses = [
  'new', 'contacted', 'inprogress', 'converted', 'lost'
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
  const [importPreview, setImportPreview] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

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

  // Excel import handlers
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setImportPreview(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportUpload = async () => {
    if (!importFile) return;
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success > 0) {
        toast.success(`Imported ${data.success} leads!`);
        setImportPreview([]);
        setImportFile(null);
        fetchLeads(platformFilter);
      } else {
        toast.error(data.message || 'Import failed');
      }
      if (data.errors && data.errors.length > 0) {
        toast.warn(`${data.errors.length} rows had errors. Check console for details.`);
        console.warn('Import errors:', data.errors);
      }
    } catch (err) {
      toast.error('Import failed: ' + (err.message || err));
    }
    setImportLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#fff]">
      <h1 className="text-4xl font-extrabold mb-10 mt-10 text-gray-800 drop-shadow-lg tracking-tight animate-fade-in-down">Leads</h1>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-8 w-full max-w-4xl animate-fade-in-up">
        <input name="name" placeholder="Lead Name" value={form.name} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded-lg w-full shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200" />
        <input name="contact" placeholder="Contact Info" value={form.contact} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded-lg w-full shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200" />
        <select name="platform" value={form.platform} onChange={handleChange} required className="input input-bordered px-3 py-2 border rounded-lg w-full shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200">
          <option value="">Select Platform</option>
          {platforms.filter(p => p.value).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="input input-bordered px-3 py-2 border rounded-lg w-full shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200" />
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-lg font-bold hover:scale-105 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 active:scale-95">Add Lead</button>
      </form>
      {/* Import Excel UI */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center w-full max-w-4xl animate-fade-in-up">
        <label className="font-semibold text-white drop-shadow">Import Leads from Excel:</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="input input-bordered px-3 py-2 border rounded-lg shadow w-full max-w-xs bg-white/80" />
        {importPreview.length > 0 && (
          <button onClick={handleImportUpload} disabled={importLoading} className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg shadow-lg font-bold hover:scale-105 hover:from-green-600 hover:to-blue-600 transition-all duration-200 active:scale-95">
            {importLoading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>
      {/* Preview Table */}
      {importPreview.length > 0 && (
        <div className="mb-8 overflow-x-auto w-full max-w-4xl animate-fade-in-up">
          <div className="font-semibold mb-2 text-white drop-shadow">Preview ({importPreview.length} rows):</div>
          <table className="min-w-full border text-sm rounded-xl overflow-hidden shadow-xl bg-white/80 backdrop-blur-md animate-fade-in-up">
            <thead>
              <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
                {Object.keys(importPreview[0]).map(key => (
                  <th key={key} className="py-2 px-3 border font-bold text-gray-700">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importPreview.slice(0, 10).map((row, i) => (
                <tr key={i} className="even:bg-blue-50 hover:bg-purple-100 transition-all duration-150">
                  {Object.keys(importPreview[0]).map(key => (
                    <td key={key} className="py-1 px-3 border text-gray-800">{row[key]}</td>
                  ))}
                </tr>
              ))}
              {importPreview.length > 10 && (
                <tr><td colSpan={Object.keys(importPreview[0]).length} className="text-center py-2 text-gray-600">...and {importPreview.length - 10} more rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-2 mb-6 w-full max-w-4xl animate-fade-in-up">
        <label className="font-semibold text-white drop-shadow">Filter by Platform:</label>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="input input-bordered px-3 py-2 border rounded-lg shadow w-full max-w-xs bg-white/80">
          {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto w-full max-w-6xl animate-fade-in-up">
        <div className="rounded-2xl shadow-2xl bg-white/80 backdrop-blur-md p-4 md:p-8 animate-fade-in-up">
          <table className="min-w-full border text-sm rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
                <th className="py-2 px-3 border font-bold text-gray-700">Name</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Contact</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Platform</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Status</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Status Note</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Active</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Assigned To</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Notes</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Created</th>
                <th className="py-2 px-3 border font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-4 text-gray-600">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-4 text-gray-600">No leads found.</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id} className="even:bg-blue-50 hover:bg-purple-100 hover:scale-[1.01] transition-all duration-200 shadow-sm">
                  <td className="py-1 px-3 border font-semibold text-gray-800">{lead.name}</td>
                  <td className="py-1 px-3 border text-gray-700">{lead.contact}</td>
                  <td className="py-1 px-3 border capitalize text-blue-700 font-semibold">{lead.platform}</td>
                  <td className="py-1 px-3 border capitalize">
                    <select value={lead.status} onChange={e => handleUpdate(lead._id, { status: e.target.value })} className="input input-bordered px-2 py-1 border rounded shadow focus:ring-2 focus:ring-purple-400 transition-all duration-200">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-1 px-3 border">
                    <input value={lead.statusNote || ''} onChange={e => handleUpdate(lead._id, { statusNote: e.target.value })} className="input input-bordered px-2 py-1 border rounded shadow focus:ring-2 focus:ring-purple-400 transition-all duration-200" placeholder="Status note" />
                  </td>
                  <td className="py-1 px-3 border">
                    <input type="checkbox" checked={lead.active} onChange={e => handleUpdate(lead._id, { active: e.target.checked })} className="accent-purple-600 scale-125" />
                  </td>
                  <td className="py-1 px-3 border">
                    {editingAssignment === lead._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={lead.assignedTo?._id || ''}
                          onChange={e => handleUpdate(lead._id, { assignedTo: e.target.value })}
                          className="input input-bordered px-2 py-1 border rounded w-40 shadow focus:ring-2 focus:ring-blue-400 transition-all duration-200"
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
                            className="text-gray-500 hover:text-red-600 text-lg transition-all duration-150"
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
                          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold shadow-sm">
                            {lead.assignedTo.name} <span className="text-gray-500 font-normal">({lead.assignedTo.role})</span>
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-500 px-2 py-0.5 rounded italic">Unassigned</span>
                        )}
                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            className="ml-1 text-blue-600 hover:text-blue-900 text-lg transition-all duration-150 hover:scale-125"
                            onClick={() => setEditingAssignment(lead._id)}
                            title="Edit assignment"
                          >
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-1 px-3 border text-gray-700">{lead.notes}</td>
                  <td className="py-1 px-3 border text-gray-600">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="py-1 px-3 border">
                    {currentUser?.role === 'admin' && (
                      <button onClick={() => handleDelete(lead._id)} className="text-red-600 hover:underline hover:scale-110 transition-all duration-150 font-bold">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 