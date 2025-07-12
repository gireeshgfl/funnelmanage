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

  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_ROUTES.SESSION_SERVICE.GET_DASHBOARD_OVERVIEW);
      
      // Make sure to use the data from the response properly
      setStats({
        upcomingSessions: data.data?.upcomingSessions || 0,
        questions: data.data?.questions || 0,
        funnels: data.data?.funnels || 0,
        rewardsGiven: data.data?.rewardsGiven || 0,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Failed to load stats');
      // Optionally reset stats on error
      setStats({
        upcomingSessions: 0,
        questions: 0,
        funnels: 0,
        rewardsGiven: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, loadStats };
}