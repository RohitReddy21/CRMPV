import { Outlet } from 'react-router-dom';

export default function ReportsPage() {
  return (
    <div className="max-w-5xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Reports</h1>
      <Outlet />
    </div>
  );
} 