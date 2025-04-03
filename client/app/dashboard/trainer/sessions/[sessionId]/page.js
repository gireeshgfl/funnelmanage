'use client';
import React, { useState, useEffect, useContext } from 'react';
import { Plus, X, MessageSquare, Users, BookOpen, List, Award } from 'lucide-react';
import MCQCreation from '@/components/MCQCreation';
import CouponPage from '@/components/CouponPage';
import ChatRoom from '@/components/ChatRoom';
import ParticipantsList from '@/components/ParticipantsList';
import QuestionBank from '@/components/QuestionBank';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';
import { useRouter } from 'next/navigation';

const IndexPage = () => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [trainerName, setTrainerName] = useState('Trainer');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useContext(SocketContext);
  const router = useRouter();

  // Extract session ID from URL
  const sessionId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : '';

  useEffect(() => {
    const fetchTrainerData = async () => {
      try {
        const response = await fetch(API_ROUTES.AUTH_SERVICE.USER, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setTrainerName(data.username.charAt(0).toUpperCase() + data.username.slice(1));
        } else {
          setError('Authentication required');
          router.push('/login');
        }
      } catch (err) {
        console.error('Failed to load trainer data:', err);
        setError('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainerData();
  }, [router]);

  const handlePushContent = (type, content) => {
    if (socket) {
      const event = type === 'mcq' ? 'pushMCQs' : 'pushCoupons';
      socket.emit(event, { 
        [type === 'mcq' ? 'mcqArray' : 'coupons']: content, 
        sessionId 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Participants Panel */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold">Participants</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ParticipantsList currentSessionId={sessionId} />
        </div>
      </div>

      {/* Question Bank Panel */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold">Question Bank</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <QuestionBank />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Session Workspace</h2>
          </div>
          
          {activeFeature ? (
            <button
              onClick={() => setActiveFeature(null)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <div className="relative">
              <button className="flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm">
                <Plus className="h-4 w-4 mr-1" />
                <span>Add Content</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={() => setActiveFeature('MCQCreation')}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <List className="h-4 w-4 mr-2" />
                  <span>Create MCQs</span>
                </button>
                <button
                  onClick={() => setActiveFeature('CouponPage')}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Award className="h-4 w-4 mr-2" />
                  <span>Manage Coupons</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Feature Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
          {activeFeature === 'MCQCreation' && (
            <MCQCreation pushMCQsToChat={(mcqs) => handlePushContent('mcq', mcqs)} />
          )}
          {activeFeature === 'CouponPage' && (
            <CouponPage pushCouponsToChat={(coupons) => handlePushContent('coupon', coupons)} />
          )}
        </div>

        {/* Chat Room */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ChatRoom 
            sessionId={sessionId} 
            trainerUserName={trainerName} 
            isTrainer={true} 
          />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;