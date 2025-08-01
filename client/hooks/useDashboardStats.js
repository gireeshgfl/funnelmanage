// hooks/useDashboardStats.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/config';

export default function useDashboardStats() {
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    questions: 0,
    funnels: 0,
    rewardsGiven: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      
      const response = await axios.get(API_ROUTES.SESSION_SERVICE.GET_DASHBOARD_OVERVIEW);
      
      if (response.status === 200) {
        setStats({
          upcomingSessions: response.data.data?.upcomingSessions || 0,
          questions: response.data.data?.questions || 0,
          funnels: response.data.data?.funnels || 0,
          rewardsGiven: response.data.data?.rewardsGiven || 0,
        });
      } else {
        setError(`Unexpected status code: ${response.status}`);
        setStatusCode(response.status);
      }
    } catch (err) {
      const errorStatus = err.response?.status;
      setStatusCode(errorStatus || 500);
      
      if (errorStatus === 401) {
        setError('Unauthorized - Please login again');
      } else if (errorStatus === 403) {
        setError('Forbidden - You don\'t have permission');
      } else if (errorStatus === 404) {
        setError('Data not found');
      } else {
        setError(err.message || 'Failed to load dashboard stats');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, statusCode, loadStats };
}