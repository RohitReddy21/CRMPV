import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { handleApiResponse } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const statusColors = {
  new: '#3b82f6',
  contacted: '#f59e42',
  inprogress: '#fbbf24',
  converted: '#22c55e',
  lost: '#ef4444',
};

export default function SalesReport() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [statusCounts, setStatusCounts] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchReport() {
      try {
        const params = [];
        if (range) params.push(`range=${range}`);
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        const url = `/api/reports/sales${params.length ? '?' + params.join('&') : ''}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const result = await handleApiResponse(response);
        if (result && result.statusCounts) setStatusCounts(result.statusCounts);
        else setStatusCounts(null);
      } catch (err) {
        toast.error('Failed to fetch sales report');
        setStatusCounts(null);
      }
    }
    fetchReport();
    // eslint-disable-next-line
  }, [range, month, year]);

  const chartData = statusCounts
    ? Object.entries(statusCounts).map(([status, count]) => ({ status, count, color: statusColors[status] }))
    : [];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Sales Report</h2>
      <div className="flex gap-4 mb-6">
        <select value={range} onChange={e => setRange(e.target.value)} className="input input-bordered px-2 py-1 border rounded">
          <option value="day">Last 1 Day</option>
          <option value="week">Last 1 Week</option>
          <option value="month">Last 1 Month</option>
          <option value="year">This Year</option>
        </select>
        <input type="number" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} className="input input-bordered px-2 py-1 border rounded" min="2000" max="2100" />
        <input type="number" placeholder="Month (1-12)" value={month} onChange={e => setMonth(e.target.value)} className="input input-bordered px-2 py-1 border rounded" min="1" max="12" />
      </div>
      {statusCounts ? (
        <>
          <div className="flex flex-wrap gap-6 mb-8">
            {chartData.map(({ status, count, color }) => (
              <div key={status} className={`flex flex-col items-center rounded-xl shadow p-6 min-w-[120px]`} style={{ background: color + '22' }}>
                <span className="text-lg font-bold capitalize mb-1">{status}</span>
                <span className="text-2xl font-extrabold">{count}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales by Status (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Distribution (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={entry.color} />
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