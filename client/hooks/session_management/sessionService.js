import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const getSessions = async () => {
  const response = await apiClient.get(API_ROUTES.SESSION_SERVICE.GET_SESSIONS);

  if (response.status === 204) {
    return [];
  }

  return response.data.data;
};

export const createSession = async (sessionData) => {
  const response = await apiClient.post(API_ROUTES.SESSION_SERVICE.SAVE_SESSIONS, sessionData);
  return response.data;
};

export const updateSession = async (sessionData) => {
  const response = await apiClient.put(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, sessionData);
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const url = `${API_ROUTES.SESSION_SERVICE.DELETE_SESSIONS}?id=${sessionId}`;
  const response = await apiClient.delete(url);
  return response.data;
};

export const archiveSession = async (sessionId) => {
  const response = await apiClient.put(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, { _id: sessionId, archived: "True" });
  return response.data;
};

export const unarchiveSession = async (sessionId) => {
  const response = await apiClient.put(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, { _id: sessionId, archived: "False" });
  return response.data;
};

export const activateSession = async (sessionId, newStatus) => {
  const response = await apiClient.put(API_ROUTES.SESSION_SERVICE.UPDATE_SESSIONS, { _id: sessionId, status: newStatus });
  return response.data;
};