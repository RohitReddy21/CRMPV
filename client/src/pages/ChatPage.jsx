
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChatPage = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedChat, setSelectedChat] = useState(localStorage.getItem('selectedChat') || null);
  const [isGroup, setIsGroup] = useState(localStorage.getItem('isGroup') === 'true');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]); // userIds
  const [groupToEdit, setGroupToEdit] = useState(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // Persist selection
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', selectedChat);
      localStorage.setItem('isGroup', isGroup);
    }
  }, [selectedChat, isGroup]);

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
      await axios.post(`${BASE_URL}/api/chat/groups/${groupToEdit._id}/add`, { userIds: groupMembers }, { headers: { Authorization: `Bearer ${token}` } });
      const groupsRes = await axios.get(`${BASE_URL}/api/chat/groups`, { headers: { Authorization: `Bearer ${token}` } });
      setGroups(groupsRes.data);
      setShowGroupModal(false);
    } catch (err) {
      alert('Failed to add members');
    }
  };

  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const usersRes = await axios.get(`${BASE_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(usersRes.data.filter(u => u._id !== currentUser._id));
        const groupsRes = await axios.get(`${BASE_URL}/api/chat/groups`, { headers: { Authorization: `Bearer ${token}` } });
        setGroups(groupsRes.data);
      } catch (err) {
        setUsers([]);
        setGroups([]);
      }
    };
    fetchUsersAndGroups();
  }, [currentUser]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/api/chat/groups`, { name: newGroupName }, { headers: { Authorization: `Bearer ${token}` } });
      setGroups((prev) => [...prev, res.data]);
      setNewGroupName('');
    } catch (err) {
      alert('Failed to create group');
    }
  };

  useEffect(() => {
    socketRef.current = io(BASE_URL || 'http://localhost:5001', { transports: ['websocket'] });
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
          res = await axios.get(`${BASE_URL}/api/chat/group/${selectedChat}`, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          res = await axios.get(`${BASE_URL}/api/chat/${selectedChat}`, { headers: { Authorization: `Bearer ${token}` } });
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
    // Optimistic UI update could be added here, but waiting for server ensures delivery
    socketRef.current.emit('chatMessage', msg);
    setInput('');
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    if (user.name) return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  const getChatName = () => {
    if (isGroup) {
      const group = groups.find(g => g._id === selectedChat);
      return group ? group.name : 'Unknown Group';
    } else {
      const user = users.find(u => u._id === selectedChat);
      return user ? (user.name || user.email) : 'Unknown User';
    }
  }

  const getUserById = (id) => users.find(u => u._id === id) || (currentUser._id === id ? currentUser : null);

  return (
    <div className="flex h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-6xl mx-auto mt-6">
      <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
          <div className="flex mt-4 gap-2">
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              placeholder="New Group Name"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</div>
          {users.map(u => (
            <div
              key={u._id}
              onClick={() => { setSelectedChat(u._id); setIsGroup(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${!isGroup && selectedChat === u._id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {getUserInitials(u)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{u.name || u.email}</div>
                <div className="text-xs text-green-500 flex items-center gap-1">● Online</div>
              </div>
            </div>
          ))}

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            <span>Groups</span>
          </div>
          {groups.map(g => (
            <div
              key={g._id}
              onClick={() => { setSelectedChat(g._id); setIsGroup(true); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isGroup && selectedChat === g._id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                #
              </div>
              <div className="flex-1 min-w-0 font-medium truncate">{g.name}</div>
              <button onClick={(e) => { e.stopPropagation(); openGroupModal(g) }} className="text-gray-400 hover:text-indigo-600 p-1">⚙️</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white relative">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700">Detailed Chat</h3>
            <p className="max-w-xs mt-2">Select a user or group to start chatting. Your conversations are secure.</p>
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-gray-100 flex items-center px-6 bg-white shrink-0 z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mr-4">
                {isGroup ? '#' : getUserInitials(getUserById(selectedChat))}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{getChatName()}</h3>
                {isGroup && <span className="text-xs text-gray-500">{groupToEdit ? `${groupToEdit.members?.length || 0} members` : 'Group Chat'}</span>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => {
                const isMine = msg.sender === currentUser._id;
                const user = getUserById(msg.sender);
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && isGroup && <span className="text-xs text-gray-500 ml-1 mb-1">{user?.name}</span>}
                      <div className={`px-5 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed relative group ${isMine
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                        {msg.content}

                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 opacity-70 mx-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Group Member Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Manage Members</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {users.map(u => (
                  <label key={u._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {getUserInitials(u)}
                      </div>
                      <span className="font-medium text-gray-700">{u.name || u.email}</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                      checked={groupMembers.includes(u._id)}
                      onChange={e => {
                        if (e.target.checked) setGroupMembers(m => [...m, u._id]);
                        else setGroupMembers(m => m.filter(id => id !== u._id));
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50"
                onClick={handleAddMembers}
                disabled={groupMembers.length === 0}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default ChatPage;
