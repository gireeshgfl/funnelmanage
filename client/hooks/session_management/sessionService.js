import { API_ROUTES } from '@/config';

export const getSessions = async () => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.GET_SESSIONS, { cache: 'no-store' });

  if (response.status === 204) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Error fetching sessions: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
};

export const createSession = async (sessionData) => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.SAVE_SESSIONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });
  if (!response.ok) {
    throw new Error(`Error creating session: ${response.statusText}`);
  }
  return response.json();
};

export const updateSession = async (sessionData) => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });
  if (!response.ok) {
    throw new Error(`Error updating session: ${response.statusText}`);
  }
  return response.json();
};

export const deleteSession = async (sessionId) => {
  const url = `${API_ROUTES.SESSION_SERVICE.DELETE_SESSIONS}?id=${sessionId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Error deleting session: ${response.statusText}`);
  }
  return response.json();
};

export const archiveSession = async (sessionId) => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id: sessionId, archived: "True" }),
  });
  if (!response.ok) {
    throw new Error(`Error archiving session: ${response.statusText}`);
  }
  return response.json();
};

export const unarchiveSession = async (sessionId) => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id: sessionId, archived: "False" }),
  });
  if (!response.ok) {
    throw new Error(`Error unarchiving session: ${response.statusText}`);
  }
  return response.json();
};

export const activateSession = async (sessionId, newStatus) => {
  const response = await fetch(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id: sessionId, status: newStatus }),
  });
  if (!response.ok) {
    throw new Error(`Error updating session status: ${response.statusText}`);
  }
  return response.json();
};