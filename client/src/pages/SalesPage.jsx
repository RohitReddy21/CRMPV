import { useEffect, useState } from 'react';
import { getLeads } from '../api';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  inprogress: 'bg-orange-100 text-orange-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export default function SalesPage() {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchLeads() {
      const allLeads = await getLeads(token);
      setLeads(allLeads);
    }
    fetchLeads();
  }, [token]);

  const filteredLeads = statusFilter ? leads.filter(l => l.status === statusFilter) : leads;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#fff]">
      <h1 className="text-4xl font-extrabold mb-10 mt-10 text-gray-800 drop-shadow-lg tracking-tight animate-fade-in-down">Sales Progress</h1>
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold text-gray-700">Filter by Status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input input-bordered px-3 py-2 border rounded-lg shadow">
          <option value="">All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="inprogress">In Progress</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <div className="overflow-x-auto w-full max-w-6xl animate-fade-in-up">
        <table className="min-w-full border text-sm rounded-xl overflow-hidden shadow-xl bg-white/80 backdrop-blur-md animate-fade-in-up">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
              <th className="py-2 px-3 border font-bold text-gray-700">Name</th>
              <th className="py-2 px-3 border font-bold text-gray-700">Contact</th>
              <th className="py-2 px-3 border font-bold text-gray-700">Platform</th>
              <th className="py-2 px-3 border font-bold text-gray-700">Status</th>
              <th className="py-2 px-3 border font-bold text-gray-700">Assigned To</th>
              <th className="py-2 px-3 border font-bold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-gray-600">No leads found.</td></tr>
            ) : filteredLeads.map(lead => (
              <tr key={lead._id} className="even:bg-blue-50 hover:bg-purple-100 transition-all duration-150">
                <td className="py-1 px-3 border font-semibold text-gray-800">{lead.name}</td>
                <td className="py-1 px-3 border text-gray-700">{lead.contact}</td>
                <td className="py-1 px-3 border capitalize text-blue-700 font-semibold">{lead.platform}</td>
                <td className={`py-1 px-3 border capitalize font-bold ${statusColors[lead.status] || ''}`}>{lead.status}</td>
                <td className="py-1 px-3 border text-gray-700">{lead.assignedTo?.name || 'Unassigned'}</td>
                <td className="py-1 px-3 border text-gray-600">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
