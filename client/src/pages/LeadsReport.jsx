import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { handleApiResponse, BASE_URL } from '../api';

export default function LeadsReport() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchReport() {
      try {
        const params = [];
        if (range) params.push(`range=${range}`);
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        if (platform) params.push(`platform=${platform}`);
        if (status) params.push(`status=${status}`);
        const url = `${BASE_URL}/api/reports/leads${params.length ? '?' + params.join('&') : ''}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const result = await handleApiResponse(response);
        if (result) setData(result);
      } catch (err) {
        toast.error('Failed to fetch leads report');
      }
    }
    fetchReport();
    // eslint-disable-next-line
  }, [range, month, year, platform, status]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leads Report</h2>
      <div className="flex gap-4 mb-6">
        <select value={range} onChange={e => setRange(e.target.value)} className="input input-bordered px-2 py-1 border rounded">
          <option value="day">Last 1 Day</option>
          <option value="week">Last 1 Week</option>
          <option value="month">Last 1 Month</option>
          <option value="year">This Year</option>
        </select>
        <input type="number" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} className="input input-bordered px-2 py-1 border rounded" min="2000" max="2100" />
        <input type="number" placeholder="Month (1-12)" value={month} onChange={e => setMonth(e.target.value)} className="input input-bordered px-2 py-1 border rounded" min="1" max="12" />
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="input input-bordered px-2 py-1 border rounded">
          <option value="">All Platforms</option>
          <option value="linkedin">LinkedIn</option>
          <option value="meta">Meta</option>
          <option value="google">Google</option>
          <option value="website">Website</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input input-bordered px-2 py-1 border rounded">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      {data ? (
        <div>
          <div className="mb-4">{data.map(d => (
            <div key={d._id} className="mb-2">
              <b>{d._id || 'Unknown Platform'}:</b> Total: {d.total}, Converted: {d.converted}, Lost: {d.lost}, New: {d.new}
            </div>
          ))}</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#4f46e5" name="Total Leads" />
              <Bar dataKey="converted" fill="#22d3ee" name="Converted" />
              <Bar dataKey="lost" fill="#f87171" name="Lost" />
              <Bar dataKey="new" fill="#a3e635" name="New" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
} 