import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { handleApiResponse, BASE_URL } from '../api';

export default function AttendanceReport() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchReport() {
      try {
        const params = [];
        if (range) params.push(`range=${range}`);
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        const url = `${BASE_URL}/api/reports/attendance${params.length ? '?' + params.join('&') : ''}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const result = await handleApiResponse(response);
        if (result) {
          setData(result);
          // Prepare chart data (group by date)
          if (result.records) {
            const grouped = {};
            result.records.forEach(r => {
              const date = new Date(r.date).toLocaleDateString();
              if (!grouped[date]) grouped[date] = { date, clockIns: 0, clockOuts: 0 };
              if (r.clockIn) grouped[date].clockIns += 1;
              if (r.clockOut) grouped[date].clockOuts += 1;
            });
            setChartData(Object.values(grouped));
          } else {
            setChartData([]);
          }
        }
      } catch (err) {
        toast.error('Failed to fetch attendance report');
      }
    }
    fetchReport();
    // eslint-disable-next-line
  }, [range, month, year]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Attendance Report</h2>
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
      {data ? (
        <div>
          <div className="mb-4">Total Clock Ins: <b>{data.totalClockIns}</b> | Total Clock Outs: <b>{data.totalClockOuts}</b></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="clockIns" fill="#4f46e5" name="Clock Ins" />
              <Bar dataKey="clockOuts" fill="#22d3ee" name="Clock Outs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
} 