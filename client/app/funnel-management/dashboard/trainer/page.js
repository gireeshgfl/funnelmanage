'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/config';
import { Calendar, BookOpen, Gift, Filter } from 'lucide-react';
import useDashboardStats from '@/hooks/useDashboardStats';

const TrainerDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const { stats, loading, error, loadStats } = useDashboardStats();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await axios.get(API_ROUTES.AUTH_SERVICE.USER, {
          withCredentials: true,
        });
        setUserName(capitalizeFirstLetter(userResponse.data.username));
        
        // Load dashboard stats
        await loadStats();
      } catch (error) {
        if (error.response?.status === 401) {
          router.push('/funnel-management/login');
        } else {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [router, loadStats]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigateTo = (path) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <p>{error}</p>
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
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/sessions')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Create New Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigateTo('/funnel-management/dashboard/trainer/sessions')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Sessions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.upcomingSessions}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateTo('/funnel-management/dashboard/trainer/question-bank')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.questions}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateTo('/funnel-management/dashboard/trainer/funnels')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Funnels</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.funnels}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateTo('/funnel-management/dashboard/trainer/rewards')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rewards Given</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.rewardsGiven}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Gift className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/sessions')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">New Session</span>
            </button>
            <button
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/question-bank')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Add Question</span>
            </button>
            <button
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/funnels')}
              className="flex items-center space-x-2 text-left p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Manage Funnel</span>
            </button>
            <button
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/rewards')}
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
              onClick={() => navigateTo('/funnel-management/dashboard/trainer/sessions')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((session) => (
              <div key={session} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors cursor-pointer">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 mr-3">
                  <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Training Session #{session}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tomorrow, 10:00 AM - 12:00 PM</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">12 students</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;