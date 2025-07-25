import ChatPage from './pages/ChatPage';
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
// import SalesPage from './pages/SalesPage';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


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
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#fff] flex">
      <aside className="w-60 bg-white/80 backdrop-blur-md shadow-2xl flex flex-col py-10 px-4 animate-fade-in-left rounded-tr-3xl rounded-br-3xl">
        <div className="text-3xl font-extrabold text-blue-700 mb-10 tracking-tight drop-shadow animate-fade-in-down transition-transform duration-300 hover:scale-105 select-none cursor-pointer">
          <span className="inline-block animate-pulse">CRM</span>
        </div>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 hover:scale-105 ${location.pathname === '/dashboard' ? 'bg-blue-200 text-blue-800 shadow' : 'text-gray-700'}`}>Dashboard</Link>
          <Link to="/leads" className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-purple-100 hover:text-purple-700 hover:scale-105 ${location.pathname === '/leads' ? 'bg-purple-200 text-purple-800 shadow' : 'text-gray-700'}`}>Leads</Link>
          <Link to="/attendance" className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-green-100 hover:text-green-700 hover:scale-105 ${location.pathname === '/attendance' ? 'bg-green-200 text-green-800 shadow' : 'text-gray-700'}`}>Attendance</Link>
          <Link to="/chat" className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-cyan-100 hover:text-cyan-700 hover:scale-105 ${location.pathname === '/chat' ? 'bg-cyan-200 text-cyan-800 shadow' : 'text-gray-700'}`}>Chat</Link>
          {role === 'admin' && (
            <div>
              <button
                className="w-full text-left px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-yellow-100 hover:text-yellow-700 hover:scale-105 flex items-center justify-between"
                onClick={() => setReportsOpen((open) => !open)}
              >
                Reports
                <span className="ml-2">{reportsOpen ? '▲' : '▼'}</span>
              </button>
              {reportsOpen && (
                <div className="ml-4 flex flex-col gap-1 animate-fade-in-down">
                  <Link to="/reports/attendance" className={`px-4 py-1 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 ${location.pathname === '/reports/attendance' ? 'bg-blue-200 text-blue-800 shadow' : 'text-gray-700'}`}>Attendance</Link>
                  <Link to="/reports/leads" className={`px-4 py-1 rounded-lg font-semibold transition-all duration-200 hover:bg-purple-100 hover:text-purple-700 ${location.pathname === '/reports/leads' ? 'bg-purple-200 text-purple-800 shadow' : 'text-gray-700'}`}>Leads</Link>
                  <Link to="/reports/sales" className={`px-4 py-1 rounded-lg font-semibold transition-all duration-200 hover:bg-yellow-100 hover:text-yellow-700 ${location.pathname === '/reports/sales' ? 'bg-yellow-200 text-yellow-800 shadow' : 'text-gray-700'}`}>Sales</Link>
                </div>
              )}
            </div>
          )}
          {role === 'admin' && <Link to="/admin/register" className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-pink-100 hover:text-pink-700 hover:scale-105 ${location.pathname === '/admin/register' ? 'bg-pink-200 text-pink-800 shadow' : 'text-gray-700'}`}>Admin Register</Link>}
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
    const socket = io(BASE_URL, {
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
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
            <Route path="/chat" element={<ChatPage currentUser={user} />} />
            {/* <Route path="/sales" element={<SalesPage />} /> */}
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
