import ChatPage from './pages/ChatPage';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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

import SalesPage from './pages/SalesPage';
import TasksPage from './pages/TasksPage';
import Sidebar from './components/Sidebar';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { FaBars } from 'react-icons/fa';

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

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shrink-0">
          <div className="font-bold text-xl text-gray-800">CRMPV</div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <FaBars className="text-xl" />
          </button>
        </div>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-gray-50 relative custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;

    const socket = io(BASE_URL || 'http://localhost:5001', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.emit('identify', user._id);
    socket.on('leadAssigned', (data) => {
      toast.info(data.message, { autoClose: 4000 });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/chat" element={<ChatPage currentUser={user} />} />

            <Route path="/admin/register" element={<AdminRegisterPage />} />

            <Route element={<RequireAdmin />}>
              <Route path="/reports" element={<ReportsPage />}>
                <Route path="attendance" element={<AttendanceReport />} />
                <Route path="leads" element={<LeadsReport />} />
                <Route path="sales" element={<SalesReport />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
