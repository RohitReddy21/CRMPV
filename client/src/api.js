// API helper for authentication
export async function handleApiResponse(response) {
  if (response.status === 304) {
    return null;
  }
  if (!response.ok) {
    const text = await response.text();
    console.error('HTTP error! status:', response.status, 'Response:', text);
    throw new Error('Received non-JSON response');
  }
  return response.json();
}

export async function registerUser({ name, email, password, role }) {
  const response = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleApiResponse(response);
}

export async function loginUser({ email, password }) {
  const response = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleApiResponse(response);
}

export async function getCurrentUser(token) {
  const response = await fetch('http://localhost:5001/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function updateCurrentUser(token, updates) {
  const response = await fetch('http://localhost:5001/api/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return handleApiResponse(response);
}

export async function getAllUsers(token) {
  const response = await fetch('http://localhost:5001/api/auth/users', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function getUserStats(token) {
  const response = await fetch('http://localhost:5001/api/auth/stats', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function fetchAllUsers(token) {
  const response = await fetch('http://localhost:5001/api/auth/users', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.ok ? response.json() : [];
}

// Leads
export async function addLead(token, lead) {
  const response = await fetch('http://localhost:5001/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(lead),
  });
  return handleApiResponse(response);
}

export async function getLeads(token, platform) {
  const url = platform ? `http://localhost:5001/api/leads?platform=${platform}` : 'http://localhost:5001/api/leads';
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function updateLead(token, id, updates) {
  const response = await fetch(`http://localhost:5001/api/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return handleApiResponse(response);
}

export async function deleteLead(token, id) {
  const response = await fetch(`http://localhost:5001/api/leads/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.ok ? response.json() : { error: 'Failed to delete lead' };
}

// Attendance
export async function getAttendance(token, user, date) {
  let url = 'http://localhost:5001/api/attendance';
  const params = [];
  if (user) params.push(`user=${user}`);
  if (date) params.push(`date=${date}`);
  if (params.length) url += '?' + params.join('&');
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}

export async function clockIn(token) {
  const response = await fetch('http://localhost:5001/api/attendance/clockin', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}

export async function clockOut(token) {
  const response = await fetch('http://localhost:5001/api/attendance/clockout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}

export async function deleteAttendance(token, id) {
  const response = await fetch(`http://localhost:5001/api/attendance/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
} 