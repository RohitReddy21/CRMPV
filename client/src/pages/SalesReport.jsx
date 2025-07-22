import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { handleApiResponse } from '../api';

export default function SalesReport() {
  const [range, setRange] = useState('month');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [data, setData] = useState(null);
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
        if (result) setData(result);
      } catch (err) {
        toast.error('Failed to fetch sales report');
      }
    }
    fetchReport();
    // eslint-disable-next-line
  }, [range, month, year]);

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
      {data ? (
        <div>
          <div className="mb-4">{data.message || '[Sales data here]'}</div>
          {/* Placeholder for chart/graph */}
          <div className="bg-gray-100 p-4 rounded">[Sales Chart Here]</div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
} 