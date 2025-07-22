import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useLocation } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import AttendancePage from './pages/AttendancePage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import ReportsPage from './pages/ReportsPage';
import AttendanceReport from './pages/AttendanceReport';
import LeadsReport from './pages/LeadsReport';
import SalesReport from './pages/SalesReport';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';

function RequireAuth() {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" />;
}

function LayoutWithSidebar() {
  const [role, setRole] = useState(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(user.role);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white shadow-lg flex flex-col py-8 px-4">
        <div className="text-2xl font-bold text-blue-700 mb-8">CRM</div>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className="hover:bg-blue-50 rounded px-3 py-2">Dashboard</Link>
          <Link to="/leads" className="hover:bg-blue-50 rounded px-3 py-2">Leads</Link>
          <Link to="/attendance" className="hover:bg-blue-50 rounded px-3 py-2">Attendance</Link>
          {role === 'admin' && (
            <div>
              <button
                className="w-full text-left hover:bg-blue-50 rounded px-3 py-2 flex items-center justify-between"
                onClick={() => setReportsOpen((open) => !open)}
              >
                Reports
                <span>{reportsOpen ? '▲' : '▼'}</span>
              </button>
              {reportsOpen && (
                <div className="ml-4 flex flex-col gap-1">
                  <Link to="/reports/attendance" className={`hover:bg-blue-100 rounded px-3 py-1 ${location.pathname === '/reports/attendance' ? 'bg-blue-100' : ''}`}>Attendance</Link>
                  <Link to="/reports/leads" className={`hover:bg-blue-100 rounded px-3 py-1 ${location.pathname === '/reports/leads' ? 'bg-blue-100' : ''}`}>Leads</Link>
                  <Link to="/reports/sales" className={`hover:bg-blue-100 rounded px-3 py-1 ${location.pathname === '/reports/sales' ? 'bg-blue-100' : ''}`}>Sales</Link>
                </div>
              )}
            </div>
          )}
          {role === 'admin' && <Link to="/admin/register" className="hover:bg-blue-50 rounded px-3 py-2">Admin Register</Link>}
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Only connect if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;
    // Connect to Socket.IO backend
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    // Identify this user to the server
    socket.emit('identify', user._id);
    // Listen for lead assignment notifications
    socket.on('leadAssigned', (data) => {
      toast.info(data.message, { autoClose: 4000 });
      // Optionally, you can update state or refetch leads here
    });
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<LayoutWithSidebar />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/reports" element={<ReportsPage />}>
              <Route path="attendance" element={<AttendanceReport />} />
              <Route path="leads" element={<LeadsReport />} />
              <Route path="sales" element={<SalesReport />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
