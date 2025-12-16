import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaCheck, FaTrash, FaClock, FaExclamationCircle, FaUser } from 'react-icons/fa';
import { BASE_URL } from '../api';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', assignedTo: '' });
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to fetch tasks');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BASE_URL}/api/tasks`, newTask, { headers: { Authorization: `Bearer ${token}` } });
            setShowModal(false);
            setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium', assignedTo: '' });
            fetchTasks();
        } catch (err) {
            alert('Failed to create task');
        }
    };

    const handleStatusUpdate = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
        try {
            await axios.put(`${BASE_URL}/api/tasks/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await axios.delete(`${BASE_URL}/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchTasks();
        } catch (err) {
            console.error('Failed to delete task', err);
            alert('Failed to delete task (only the creator can delete)');
        }
    };

    const getPriorityColor = (p) => {
        if (p === 'High') return 'text-red-500 bg-red-50 border-red-200';
        if (p === 'Medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-green-500 bg-green-50 border-green-200';
    };

    return (
        <div className="p-8 min-h-full bg-animated">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8 glass-panel p-6 rounded-2xl shadow-xl">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">Task Manager</h1>
                        <p className="text-gray-500">Coordinate and track team tasks</p>
                    </div>
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            <FaPlus /> New Task
                        </button>
                    )}
                </div>

                <div className="grid gap-4">
                    {tasks.length === 0 ? (
                        <div className="text-center p-12 glass-panel rounded-2xl">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-bold text-gray-700">No tasks found</h3>
                            <p className="text-gray-500">Create a task to get started!</p>
                        </div>
                    ) : (
                        tasks.map(task => {
                            const isAssignedToMe = task.assignedTo?._id === currentUser._id;
                            const isCreatedByMe = task.createdBy?._id === currentUser._id;

                            return (
                                <div key={task._id} className={`glass-panel p-6 rounded-2xl shadow-md border-l-4 transition-all hover:translate-x-1 ${task.status === 'Completed' ? 'border-green-500 opacity-75' : 'border-blue-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => handleStatusUpdate(task._id, task.status)}
                                                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'}`}
                                            >
                                                {task.status === 'Completed' && <FaCheck size={12} />}
                                            </button>
                                            <div>
                                                <h3 className={`text-lg font-bold text-gray-800 ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                                                <p className="text-gray-600 mt-1 text-sm">{task.description}</p>

                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                                        <FaExclamationCircle /> {task.priority}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                                        <FaClock /> {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>

                                                    {/* User Assignment Badges */}
                                                    <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        <FaUser size={10} />
                                                        {isAssignedToMe ? 'Me' : task.assignedTo?.name || 'Unassigned'}
                                                    </span>
                                                    {!isCreatedByMe && (
                                                        <span className="text-xs text-gray-400">by {task.createdBy?.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(task._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">New Task</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                <input
                                    required
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Call Client X"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Details..."
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign To</label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Myself ({currentUser.name})</option>
                                    {users.filter(u => u._id !== currentUser._id).map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                            >
                                Assign Task
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
