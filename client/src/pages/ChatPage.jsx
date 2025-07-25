
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
const SOCKET_URL = 'http://localhost:5001';

const ChatPage = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isGroup, setIsGroup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]); // userIds
  const [groupToEdit, setGroupToEdit] = useState(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  // Open group member modal
  const openGroupModal = (group) => {
    setGroupToEdit(group);
    setGroupMembers(group.members || []);
    setShowGroupModal(true);
  };

  // Add members to group
  const handleAddMembers = async () => {
    if (!groupToEdit || groupMembers.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/chat/groups/${groupToEdit._id}/add`, { userIds: groupMembers }, { headers: { Authorization: `Bearer ${token}` } });
      // Refresh groups
      const groupsRes = await axios.get('/api/chat/groups', { headers: { Authorization: `Bearer ${token}` } });
      setGroups(groupsRes.data);
      setShowGroupModal(false);
    } catch (err) {
      alert('Failed to add members');
    }
  };

  useEffect(() => {
    // Fetch users and groups from backend
    const fetchUsersAndGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const usersRes = await axios.get('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(usersRes.data.filter(u => u._id !== currentUser._id));
        // Fetch groups from backend
        const groupsRes = await axios.get('/api/chat/groups', { headers: { Authorization: `Bearer ${token}` } });
        setGroups(groupsRes.data);
      } catch (err) {
        setUsers([]);
        setGroups([]);
      }
    };
    fetchUsersAndGroups();
  }, [currentUser]);
  // Group creation handler
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/chat/groups', { name: newGroupName }, { headers: { Authorization: `Bearer ${token}` } });
      setGroups((prev) => [...prev, res.data]);
      setNewGroupName('');
    } catch (err) {
      alert('Failed to create group');
    }
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('identify', currentUser._id);
    socketRef.current.on('chatMessage', (msg) => {
      if (
        (isGroup && msg.receiver === selectedChat) ||
        (!isGroup && ((msg.sender === selectedChat && msg.receiver === currentUser._id) || (msg.sender === currentUser._id && msg.receiver === selectedChat)))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => socketRef.current.disconnect();
  }, [currentUser, selectedChat, isGroup]);

  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        let res;
        if (isGroup) {
          res = await axios.get(`/api/chat/group/${selectedChat}`, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          res = await axios.get(`/api/chat/${selectedChat}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        setMessages(res.data);
      } catch {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedChat, isGroup]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      sender: currentUser._id,
      receiver: selectedChat,
      content: input,
      isGroup
    };
    socketRef.current.emit('chatMessage', msg);
    setInput('');
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    if (user.name) return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  const getUserById = (id) => users.find(u => u._id === id) || (currentUser._id === id ? currentUser : null);

  return (
    <div className="flex h-[80vh] bg-gradient-to-br from-slate-50 to-indigo-100 rounded-2xl shadow-lg overflow-hidden">
      <aside className="w-60 bg-slate-100 border-r border-indigo-100 p-6 flex flex-col gap-2">
        <div className="text-indigo-600 font-bold text-lg mb-2">Users</div>
        {users.map(u => (
          <div
            key={u._id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer font-medium transition-all ${!isGroup && selectedChat === u._id ? 'bg-indigo-200 text-indigo-900 shadow' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
            onClick={() => { setSelectedChat(u._id); setIsGroup(false); }}
          >
            <span className="w-8 h-8 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-base">{getUserInitials(u)}</span>
            <span>{u.name || u.email}</span>
          </div>
        ))}
        <div className="text-indigo-600 font-bold text-lg mt-6 mb-2 flex items-center justify-between">
          <span>Groups</span>
          <button
            className="ml-2 px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
            onClick={() => document.getElementById('create-group-input').focus()}
            title="Create Group"
          >+
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <input
            id="create-group-input"
            className="flex-1 px-2 py-1 rounded border border-indigo-200 text-sm bg-white focus:border-indigo-500"
            placeholder="New group name"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
          />
          <button
            className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim()}
          >Create</button>
        </div>
        {groups.map(g => (
          <div
            key={g._id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer font-medium transition-all ${isGroup && selectedChat === g._id ? 'bg-indigo-200 text-indigo-900 shadow' : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'}`}
            onClick={() => { setSelectedChat(g._id); setIsGroup(true); }}
          >
            <span className="w-8 h-8 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center font-bold text-base">{g.name[0]}</span>
            <span>{g.name}</span>
            <button
              className="ml-auto px-2 py-1 text-xs bg-indigo-400 text-white rounded hover:bg-indigo-600"
              onClick={e => { e.stopPropagation(); openGroupModal(g); }}
              title="Manage Members"
            >👥</button>
          </div>
        ))}
      {/* Group Member Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative animate-fade-in">
            <button className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-700" onClick={() => setShowGroupModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Manage Group Members</h2>
            <div className="mb-4">
              <div className="font-semibold mb-2">Select users to add:</div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupMembers.includes(u._id)}
                      onChange={e => {
                        if (e.target.checked) setGroupMembers(m => [...m, u._id]);
                        else setGroupMembers(m => m.filter(id => id !== u._id));
                      }}
                    />
                    <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-base">{getUserInitials(u)}</span>
                    <span>{u.name || u.email}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold text-base shadow hover:bg-indigo-700 transition disabled:bg-indigo-200 disabled:text-indigo-400 w-full"
              onClick={handleAddMembers}
              disabled={groupMembers.length === 0}
            >Save Members</button>
          </div>
        </div>
      )}
      </aside>
      <main className="flex-1 flex flex-col bg-slate-50">
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3">
          {messages.map((msg, idx) => {
            const isMine = msg.sender === currentUser._id;
            const user = getUserById(msg.sender);
            return (
              <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base ${isMine ? 'bg-indigo-600 text-white' : 'bg-indigo-200 text-indigo-800'}`}>{getUserInitials(user)}</span>
                  <span className="text-sm font-semibold text-slate-700">{user?.name || user?.email || 'User'}</span>
                  <span className="text-xs text-slate-400 ml-1">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                </div>
                <div className={`rounded-2xl px-5 py-3 text-base max-w-[60%] shadow ${isMine ? 'bg-indigo-600 text-white self-end' : 'bg-indigo-100 text-indigo-900 self-start'}`}>{msg.content}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center px-8 py-4 border-t border-indigo-100 bg-slate-100">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-3 rounded-lg border border-indigo-200 text-base bg-white outline-none mr-4 focus:border-indigo-500 transition"
            placeholder="Type a message..."
            disabled={!selectedChat}
          />
          <button
            className="bg-indigo-600 text-white rounded-lg px-6 py-3 font-semibold text-base shadow hover:bg-indigo-700 transition disabled:bg-indigo-200 disabled:text-indigo-400"
            onClick={sendMessage}
            disabled={!selectedChat || !input.trim()}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
