import { useCallback, useState } from 'react';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const useParticipantsSessions = (setFeedbackMessage) => {
  const [sessions, setSessions] = useState([]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await apiClient.get(API_ROUTES.SESSION_SERVICE.GET_PARTICIPANT_SESSIONS);
      const data = response.data;

      if (data?.data && Array.isArray(data.data)) {
        setSessions(data.data);
        setFeedbackMessage(data.message || 'Sessions fetched successfully!');
      } else {
        setSessions([]);
        setFeedbackMessage('No sessions assigned.');
      }
    } catch (error) {
      console.error('Error fetching participant sessions:', error);
      setFeedbackMessage('Failed to fetch sessions. Please try again.');
    }
  }, [setFeedbackMessage]);

  return { sessions, fetchSessions };
};