import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { handleApiResponse } from '../api';

const clockColors = ['#4f46e5', '#22d3ee'];

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
        const url = `/api/reports/attendance${params.length ? '?' + params.join('&') : ''}`;
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

  // Pie chart data
  const pieData = [
    { name: 'Clock Ins', value: data?.totalClockIns || 0 },
    { name: 'Clock Outs', value: data?.totalClockOuts || 0 },
  ];

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
        <>
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-blue-50">
              <span className="text-lg font-bold mb-1">Total Clock Ins</span>
              <span className="text-2xl font-extrabold text-indigo-700">{data.totalClockIns}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl shadow p-6 min-w-[120px] bg-cyan-50">
              <span className="text-lg font-bold mb-1">Total Clock Outs</span>
              <span className="text-2xl font-extrabold text-cyan-700">{data.totalClockOuts}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance by Date (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
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
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Clock In/Out Distribution (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={clockColors[idx]} />
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