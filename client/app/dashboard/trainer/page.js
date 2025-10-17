'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/config';
import { Calendar, BookOpen, Gift, Filter } from 'lucide-react';
import { getSessions } from '@/hooks/session_management/sessionService';

const TrainerDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');

  // Helper functions defined at the top level of component
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Check if session date is in the future
  const isFutureSession = (dateString) => {
    if (!dateString) return false;
    const sessionDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    return sessionDate >= today;
  };

  // Format date for display
  const formatSessionDate = (session) => {
    if (!session.date) return 'Date not set';
    
    try {
      const date = new Date(session.date);
      const time = session.time || '00:00';
      
      // Parse time if available
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if it's today
      if (date.toDateString() === now.toDateString()) {
        return `Today, ${date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}`;
      }
      
      // Check if it's tomorrow
      if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}`;
      }
      
      // For other dates
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get question count for display
  const getQuestionCount = (session) => {
    return session.questions ? session.questions.length : 0;
  };

  const navigateTo = (path) => {
    router.push(path);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setUserLoading(true);
        // Fetch user info
        const userResponse = await axios.get(API_ROUTES.AUTH_SERVICE.USER, {
          withCredentials: true,
        });
        setUserName(capitalizeFirstLetter(userResponse.data.username));
      } catch (error) {
        if (error.response?.status === 401) {
          router.push('/login');
        } else {
          console.error('Error fetching data:', error);
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError('');
        const sessionsData = await getSessions();
        setSessions(sessionsData || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessionsError('Failed to load upcoming sessions');
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Filter and sort sessions to show only active upcoming ones, limited to 3
  const upcomingSessions = sessions
    .filter(session => {
      // Show only active sessions that are not archived
      const isActive = session.status === "Activate";
      const isNotArchived = session.archived !== "True";
      const hasFutureDate = isFutureSession(session.date);
      
      return isActive && isNotArchived && hasFutureDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date ascending
    .slice(0, 3); // Limit to 3 sessions

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's what's happening with your training sessions today.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => navigateTo('/dashboard/trainer/sessions')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>My Sessions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigateTo('/dashboard/trainer/sessions')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">My Sessions</span>
            </button>
            <button
              onClick={() => navigateTo('/dashboard/trainer/question-bank')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Add Question</span>
            </button>
            <button
              onClick={() => navigateTo('/dashboard/trainer/funnels')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Manage Funnel</span>
            </button>
            <button
              onClick={() => navigateTo('/dashboard/trainer/rewards')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <Gift className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Create Reward</span>
            </button>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Sessions</h2>
            <button 
              onClick={() => navigateTo('/dashboard/trainer/sessions')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All
            </button>
          </div>
          
          {sessionsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sessions...</span>
            </div>
          ) : sessionsError ? (
            <div className="text-center py-4 text-red-500 dark:text-red-400">
              {sessionsError}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
              <button
                onClick={() => navigateTo('/dashboard/trainer/sessions')}
                className="mt-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Create your first session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div 
                  key={session._id} 
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigateTo('/dashboard/trainer/sessions')}
                >
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 mr-3">
                    <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {session.sessionName || `Training Session`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatSessionDate(session)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Topic: {session.topic || 'No topic specified'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    <div>{getQuestionCount(session)} questions</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {session.status === "Activate" ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;