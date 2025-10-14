'use client';
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Plus, X, MessageSquare, Users, BookOpen, List, Award, Filter } from 'lucide-react';
import MCQCreation from '@/components/MCQCreation';
import AddParticipants from '@/components/AddParticipants';
import CouponPage from '@/components/CouponPage';
import ChatRoom from '@/components/ChatRoom';
import ParticipantsList from '@/components/ParticipantsList';
import QuestionBank from '@/components/QuestionBank';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hooks/useAuth';

const SessionWorkspace = () => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [trainerName, setTrainerName] = useState('Trainer');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const { socket } = useContext(SocketContext);
  const { signout } = useAuth();
  const router = useRouter();

  // Extract session ID from URL
  const params = useParams();
  const sessionId = params?.sessionId || '';

  useEffect(() => {
    // Check for saved theme preference or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('color-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      
      // Prevent page scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

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
    
    // Cleanup function to reset styles when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
  }, [router]);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const handleSignout = async () => {
    try {
      await signout();
      router.push('/login');
    } catch (error) {
      console.error('Signout failed:', error);
    }
  };

  const handleEndSession = async () => {
    setIsEndingSession(true);
    try {
      const [response] = await Promise.all([
        axios.delete(`${API_ROUTES.CHAT_SERVICE.DELETE_CHAT}?id=${sessionId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }),
        new Promise(resolve => setTimeout(resolve, 1000)) 
      ]);
  
      if (response.status === 200) {
        console.log('Session ended successfully!');
        router.push('/dashboard/trainer/sessions');
      } else {
        console.error('Failed to end session:', response.data);
        setError('Failed to end session');
      }
    } catch (error) {
      console.error('Error during session end request:', error);
      setError('Error during session end');
    } finally {
      setIsEndingSession(false);
    }
  };
  
  const handlePushContent = (type, content) => {
    if (socket) {
      const event = type === 'mcq' ? 'pushMCQs' : 'pushCoupons';
      socket.emit(event, { 
        [type === 'mcq' ? 'mcqArray' : 'coupons']: content, 
        sessionId 
      });
    }
  };

  if (isEndingSession) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ending Session</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Please wait while we end the session and redirect you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-4 max-w-md rounded-lg">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col dark:bg-gray-900 transition-colors duration-200">
      {/* Fixed Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-full items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Filter className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <button 
                  onClick={() => router.push('/dashboard/trainer')}
                  className="ml-2 text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
                >
                  Funnel Management
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* End Session Button */}
              <button
                type="button"
                onClick={handleEndSession}
                className="px-3 py-1 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                End Session
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 极 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <svg 
                      className="h-5 w-5 text-primary-600 dark:text-primary-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 极 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <button
                        onClick={handleSignout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
  
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Participants (narrower) */}
        <div className="w-60 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Participants</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ParticipantsList currentSessionId={sessionId} />
          </div>
        </div>
  
        {/* Middle Section - Question Bank (wider) */}
        <div className="w-[35rem] h-full flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Question Bank</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <QuestionBank />
          </div>
        </div>
  
        {/* Right Section - Session Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-[30rem]">
          {/* Workspace Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Workspace</h2>
            </div>
            
            <div className="relative group">
              {activeFeature ? (
                <button
                  onClick={() => setActiveFeature(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close current feature"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <>
                  <button className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors group">
                    <Plus className="h-5 w-5 mr-2" />
                    <span>Add Content</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={() => setActiveFeature('MCQCreation')}
                      className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                    >
                      <List className="h-4 w-4 mr-3 text-primary-500" />
                      <span>Create MCQs</span>
                    </button>
                    <button
                      onClick={() => setActiveFeature('AddParticipants')}
                      className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-3 text-primary-500" />
                      <span>Add Participants</span>
                    </button>
                    {/* <button
                      onClick={() => setActiveFeature('CouponPage')}
                      className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                    >
                      <Award className="h-4 w-4 mr-3 text-primary-500" />
                      <span>Manage Coupons</span>
                    </button> */}
                  </div>
                </>
              )}
            </div>
          </div>
  
          {/* Dynamic Content Area */}
          {activeFeature ? (
            <>
              {/* Feature Content Area (when active) */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                {activeFeature === 'MCQCreation' && (
                  <MCQCreation pushMCQsToChat={(mcqs) => handlePushContent('mcq', mcqs)} sessionId={sessionId}/>
                )}
                {activeFeature === 'AddParticipants' && (
                  <AddParticipants sessionId={sessionId} />
                )}
                {activeFeature === 'CouponPage' && (
                  <CouponPage pushCouponsToChat={(coupons) => handlePushContent('coupon', coupons)} />
                )}
              </div>
              {/* Chat Room (reduced height when feature is active) */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-48 flex-shrink-0">
                <div className="h-full overflow-y-auto">
                  <ChatRoom 
                    sessionId={sessionId} 
                    trainerUserName={trainerName} 
                    isTrainer={true} 
                  />
                </div>
              </div>
            </>
          ) : (
            /* Full-height Chat Room (when no feature is active) */
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
              <ChatRoom 
                sessionId={sessionId} 
                trainerUserName={trainerName} 
                isTrainer={true} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionWorkspace;