
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { BASE_URL } from '../api';

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
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // Handle typing indicator
  const handleTyping = (e) => {
    setInput(e.target.value);

    if (!socketRef.current) return;

    // Emit typing event
    socketRef.current.emit('typing', { receiver: selectedChat, isGroup });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopTyping', { receiver: selectedChat, isGroup });
    }, 1000);
  };

  // Listen for typing events
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('displayTyping', ({ sender }) => {
      if (sender === selectedChat) setIsTyping(true);
    });

    socketRef.current.on('hideTyping', ({ sender }) => {
      if (sender === selectedChat) setIsTyping(false);
    });

    return () => {
      socketRef.current.off('displayTyping');
      socketRef.current.off('hideTyping');
    }
  }, [selectedChat]);

  // Persist selection
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', selectedChat);
      localStorage.setItem('isGroup', isGroup);
    }
  }, [selectedChat, isGroup]);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });

  const openProfileModal = () => {
    setProfileForm({ name: currentUser.name, email: currentUser.email });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Assuming we can re-use the updateCurrentUser from api.js but calling axios directly for simplicity here or importing it
      const res = await axios.put(`${BASE_URL}/api/auth/me`, profileForm, { headers: { Authorization: `Bearer ${token}` } });
      // Update local user if needed, but App.js handles the source of truth usually. 
      // For now, alert success. Ideally we'd update parent state or reload.
      localStorage.setItem('user', JSON.stringify(res.data.user));
      alert('Profile updated successfully! Refresh to see changes.'); // Simple feedback
      setShowProfileModal(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleUpdateGroup = async (newName) => {
    if (!groupToEdit || !newName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${BASE_URL}/api/chat/groups/${groupToEdit._id}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
      setGroups(groups.map(g => g._id === groupToEdit._id ? res.data : g));
      setGroupToEdit(res.data); // Update modal state
      alert('Group updated');
    } catch (err) {
      alert('Failed to update group');
    }
  };

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
      <aside className={`w-full md:w-72 bg-gray-50 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button onClick={openProfileModal} className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100" title="Edit Profile">
              ⚙️
            </button>
          </div>
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

      <main className={`flex-1 flex-col bg-white relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700">Detailed Chat</h3>
            <p className="max-w-xs mt-2">Select a user or group to start chatting. Your conversations are secure.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 flex items-center px-4 bg-white shrink-0 z-10 justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  ←
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  {isGroup ? '#' : getUserInitials(getUserById(selectedChat))}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{getChatName()}</h3>
                  {isGroup
                    ? <span className="text-xs text-gray-500">{groupToEdit ? `${groupToEdit.members?.length || 0} members` : 'Group Chat'}</span>
                    : isTyping
                      ? <span className="text-xs text-indigo-500 font-semibold animate-pulse">Typing...</span>
                      : <span className="text-xs text-green-500">Online</span>
                  }
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 relative custom-scrollbar header-background">
              {messages.map((msg, idx) => {
                const isMine = msg.sender === currentUser._id;
                const user = getUserById(msg.sender);
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && isGroup && <span className="text-xs text-gray-500 ml-1 mb-1">{user?.name}</span>}
                      <div className={`px-4 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed relative group transition-all duration-200 hover:shadow-md ${isMine
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 opacity-70 flex items-center justify-end gap-1 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                          {isMine && <span>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && !isGroup && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                <button className="text-gray-400 hover:text-indigo-600 px-2 text-xl">+</button>
                <input
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-2 text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transform"
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

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Group Name</label>
                <div className="flex gap-2">
                  <input
                    defaultValue={groupToEdit?.name}
                    id="groupNameInput"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateGroup(document.getElementById('groupNameInput').value)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                  >
                    Rename
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Members</label>
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
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50"
                onClick={handleAddMembers}
              >
                Update Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
                  {getUserInitials(currentUser)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  type="email"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-4">
                Save Profile
              </button>
            </form>
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
