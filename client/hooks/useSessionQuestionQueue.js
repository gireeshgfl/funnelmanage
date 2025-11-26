import { useCallback, useState } from 'react';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';

export const useSessionQuestionQueue = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch questions for a session
  const fetchQuestions = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        API_ROUTES.SESSION_SERVICE.GET_QUESTION_QUEUE,
        { sessionId },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch questions');
      }

      return response.data;
    } catch (err) {
      setError(err.message || 'Error fetching questions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save questions for a session
  const saveQuestions = useCallback(async (questions, sessionId) => {
    setIsLoading(true);
    setError(null);

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      setError('Invalid or empty question data');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post(
        API_ROUTES.SESSION_SERVICE.SAVE_QUESTION_QUEUE,
        {
          questions,
          sessionId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to save questions');
      }

      return response.data;
    } catch (err) {
      setError(err.message || 'Error saving questions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchQuestions,
    saveQuestions,
    isLoading,
    error,
  };
};