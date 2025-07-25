import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { handleApiResponse } from '../api';

export default function LeadsReport() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState({ total: 0, converted: 0, lost: 0, new: 0, contacted: 0, inprogress: 0 });
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
        const url = `/api/reports/leads${params.length ? '?' + params.join('&') : ''}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const result = await handleApiResponse(response);
        if (result) {
          setData(result);
          // Calculate summary
          let total = 0, converted = 0, lost = 0, newL = 0, contacted = 0, inprogress = 0;
          result.forEach(d => {
            total += d.total || 0;
            converted += d.converted || 0;
            lost += d.lost || 0;
            newL += d.new || 0;
            contacted += d.contacted || 0;
            inprogress += d.inprogress || 0;
          });
          setSummary({ total, converted, lost, new: newL, contacted, inprogress });
        }
      } catch (err) {
        toast.error('Failed to fetch leads report');
      }
    }
    fetchReport();
    // eslint-disable-next-line
  }, [range, month, year, platform, status]);

  // Pie chart data for status distribution
  const pieData = [
    { name: 'Converted', value: summary.converted },
    { name: 'Lost', value: summary.lost },
    { name: 'New', value: summary.new },
    { name: 'Contacted', value: summary.contacted },
    { name: 'In Progress', value: summary.inprogress },
  ];
  const pieColors = ['#22d3ee', '#f87171', '#a3e635', '#fbbf24', '#818cf8'];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leads Report</h2>
      <div className="flex gap-4 mb-6 flex-wrap">
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
          <option value="inprogress">In Progress</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      {data ? (
        <>
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-blue-50">
              <span className="text-lg font-bold mb-1">Total Leads</span>
              <span className="text-2xl font-extrabold text-indigo-700">{summary.total}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-cyan-50">
              <span className="text-lg font-bold mb-1">Converted</span>
              <span className="text-2xl font-extrabold text-cyan-700">{summary.converted}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-red-50">
              <span className="text-lg font-bold mb-1">Lost</span>
              <span className="text-2xl font-extrabold text-red-700">{summary.lost}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-lime-50">
              <span className="text-lg font-bold mb-1">New</span>
              <span className="text-2xl font-extrabold text-lime-700">{summary.new}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-yellow-50">
              <span className="text-lg font-bold mb-1">Contacted</span>
              <span className="text-2xl font-extrabold text-yellow-700">{summary.contacted}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-indigo-50">
              <span className="text-lg font-bold mb-1">In Progress</span>
              <span className="text-2xl font-extrabold text-indigo-700">{summary.inprogress}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Leads by Platform (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
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
                  <Bar dataKey="contacted" fill="#fbbf24" name="Contacted" />
                  <Bar dataKey="inprogress" fill="#818cf8" name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Lead Status Distribution (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={pieColors[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}