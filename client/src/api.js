// api.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper for API response
export async function handleApiResponse(response) {
  if (response.status === 304) return null;

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    let errorText;
    try {
      errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.message) {
          throw new Error(errorJson.message);
        }
      } catch {}
    } catch {}

    console.error('HTTP error! status:', response.status, 'Response:', errorText);
    throw new Error('HTTP error! status: ' + response.status + (errorText ? ' Response: ' + errorText : ''));
  }

  return response.json();
}

// Authentication
export async function registerUser({ name, email, password, role }) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleApiResponse(response);
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleApiResponse(response);
}

export async function getCurrentUser(token) {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function updateCurrentUser(token, updates) {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return handleApiResponse(response);
}

export async function getAllUsers(token) {
  const response = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function getUserStats(token) {
  const response = await fetch(`${BASE_URL}/api/auth/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function fetchAllUsers(token) {
  const response = await fetch(`${BASE_URL}/api/auth/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.ok ? response.json() : [];
}

// Leads
export async function addLead(token, lead) {
  const response = await fetch(`${BASE_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(lead),
  });
  return handleApiResponse(response);
}

export async function getLeads(token, platform) {
  const url = platform ? `${BASE_URL}/api/leads?platform=${platform}` : `${BASE_URL}/api/leads`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleApiResponse(response);
}

export async function updateLead(token, id, updates) {
  const response = await fetch(`${BASE_URL}/api/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  return handleApiResponse(response);
}

export async function deleteLead(token, id) {
  const response = await fetch(`${BASE_URL}/api/leads/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.ok ? response.json() : { error: 'Failed to delete lead' };
}

// Attendance
export async function getAttendance(token, user, date) {
  let url = `${BASE_URL}/api/attendance`;
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
  const response = await fetch(`${BASE_URL}/api/attendance/clockin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}

export async function clockOut(token) {
  const response = await fetch(`${BASE_URL}/api/attendance/clockout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}

export async function deleteAttendance(token, id) {
  const response = await fetch(`${BASE_URL}/api/attendance/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}
export async function getAttendanceReport(token, range, month, year) {
  const params = [];
  if (range) params.push(`range=${range}`);
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  const url = `${BASE_URL}/api/reports/attendance${params.length ? '?' + params.join('&') : ''}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleApiResponse(response);
}