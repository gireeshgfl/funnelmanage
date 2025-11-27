'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';
import { Button } from '@components/ui/components';

const StudentDashboard = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await apiClient.get(API_ROUTES.AUTH_SERVICE.USER);

        if (response.status === 200) {
          const data = response.data;
          setUserName(capitalizeFirstLetter(data?.username || 'untitled'));
        } else {
          setError('Not authenticated');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Failed to fetch user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleButtonClick = (path) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-center">
        <h2 className="text-xl font-semibold">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-primary-600 dark:text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Welcome {userName}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Button
          variant="primary"
          size="large"
          className="w-full"
          onClick={() => handleButtonClick('/dashboard/student/coupons')}
        >
          My Coupons
        </Button>

        <Button
          variant="primary"
          size="large"
          className="w-full"
          onClick={() => handleButtonClick('/dashboard/student/credits')}
        >
          Credit Store
        </Button>

        <Button
          variant="primary"
          size="large"
          className="w-full"
          onClick={() => handleButtonClick('/dashboard/student/progress-report')}
        >
          Progress Report
        </Button>
      </div>
    </div>
  );
};

export default StudentDashboard;