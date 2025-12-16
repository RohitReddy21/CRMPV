import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaChartPie,
    FaUserFriends,
    FaCalendarCheck,
    FaComments,
    FaChartLine,
    FaUserShield,
    FaBars,
    FaTimes,
    FaSignOutAlt,
    FaCheckSquare
} from 'react-icons/fa';

export default function Sidebar({ user, onLogout, isOpen, toggleSidebar }) {
    const [reportsOpen, setReportsOpen] = useState(false);
    const location = useLocation();
    const role = user?.role;

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const navItemClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300
    hover:translate-x-1 hover:shadow-lg
    ${isActive(path)
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 shadow-lg'
            : 'text-gray-600 hover:bg-white/50 hover:text-blue-600'}
  `;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />

            {/* Sidebar Container */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-2xl
          flex flex-col py-8 px-5 transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            C
                        </div>
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            CRMPV
                        </span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    <Link to="/dashboard" className={navItemClass('/dashboard')}>
                        <FaChartPie className="text-lg" />
                        <span>Dashboard</span>
                    </Link>

                    <Link to="/leads" className={navItemClass('/leads')}>
                        <FaUserFriends className="text-lg" />
                        <span>Leads</span>
                    </Link>

                    <Link to="/attendance" className={navItemClass('/attendance')}>
                        <FaCalendarCheck className="text-lg" />
                        <span>Attendance</span>
                    </Link>

                    <Link to="/chat" className={navItemClass('/chat')}>
                        <FaComments className="text-lg" />
                        <span>Chat</span>
                    </Link>

                    <Link to="/tasks" className={navItemClass('/tasks')}>
                        <FaCheckSquare className="text-lg" />
                        <span>Tasks</span>
                    </Link>

                    {role === 'admin' && (
                        <div className="space-y-2 pt-4 border-t border-gray-100 mt-4">
                            <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Admin Area
                            </div>

                            <div className="space-y-1">
                                <button
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${reportsOpen ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => setReportsOpen(!reportsOpen)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FaChartLine className="text-lg" />
                                        <span>Reports</span>
                                    </div>
                                    <span className={`transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ${reportsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="pl-12 pr-2 space-y-1 mt-1">
                                        <Link to="/reports/attendance" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            Attendance
                                        </Link>
                                        <Link to="/reports/leads" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            Leads
                                        </Link>
                                        <Link to="/reports/sales" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            Sales
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <Link to="/admin/register" className={navItemClass('/admin/register')}>
                                <FaUserShield className="text-lg" />
                                <span>Register User</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 rounded-xl mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 truncate">{user?.name}</div>
                            <div className="text-xs text-gray-500 truncate capitalize">{user?.role}</div>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                    >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
