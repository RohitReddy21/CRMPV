import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function ReportsPage() {
  const location = useLocation();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#fff]">
      <div className="max-w-5xl w-full mt-12 p-8 bg-white/80 rounded-xl shadow-lg backdrop-blur-md">
        <h1 className="text-4xl font-extrabold mb-10 text-gray-800 drop-shadow-lg tracking-tight animate-fade-in-down">Reports</h1>
        <div className="flex gap-4 mb-8 justify-center animate-fade-in-up">
          <NavLink to="/reports/attendance" className={({ isActive }) =>
            `px-6 py-2 rounded-lg font-bold transition-all duration-200 text-lg shadow hover:bg-blue-100 hover:text-blue-700 ${isActive || location.pathname === '/reports' ? 'bg-blue-200 text-blue-800 scale-105' : 'text-gray-700'}`
          }>Attendance</NavLink>
          <NavLink to="/reports/leads" className={({ isActive }) =>
            `px-6 py-2 rounded-lg font-bold transition-all duration-200 text-lg shadow hover:bg-purple-100 hover:text-purple-700 ${isActive ? 'bg-purple-200 text-purple-800 scale-105' : 'text-gray-700'}`
          }>Leads</NavLink>
          <NavLink to="/reports/sales" className={({ isActive }) =>
            `px-6 py-2 rounded-lg font-bold transition-all duration-200 text-lg shadow hover:bg-yellow-100 hover:text-yellow-700 ${isActive ? 'bg-yellow-200 text-yellow-800 scale-105' : 'text-gray-700'}`
          }>Sales</NavLink>
        </div>
        <Outlet />
      </div>
    </div>
  );
} 