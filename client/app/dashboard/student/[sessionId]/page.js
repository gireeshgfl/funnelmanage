"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ChatRoom from '@/components/ChatRoom';
import EmojiSelector from '@/components/EmojiSelector';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import { API_ROUTES } from '@/config';
import { Button } from '@components/ui/components';

const IndexPage = () => {
  const [sidebarsVisible, setSidebarsVisible] = useState(false);
  const [studentUserName, setStudentUserName] = useState('student');
  const [studentUserId, setStudentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const router = useRouter();
  const { sessionId } = useParams();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_ROUTES.AUTH_SERVICE.USER}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStudentUserName(capitalizeFirstLetter(data.username));
          setStudentUserId(data.user_id);
          await fetchPoints(data.user_id);
        } else {
          setError('Not authenticated');
          router.push('/signup');
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

  const [mcqCorrectlySubmitted, setMcqCorrectlySubmitted] = useState(false);

  useEffect(() => {
    if (mcqCorrectlySubmitted) {
      fetchPoints();
      setMcqCorrectlySubmitted(false);
    }
  }, [mcqCorrectlySubmitted]);

  const fetchPoints = async () => {
    try {
      const response = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_POINTS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPointsEarned(data.pointsEarned);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const onCorrectAnswerHandler = (isCorrect) => {
    setMcqCorrectlySubmitted(isCorrect);
    if (isCorrect) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const toggleSidebars = () => {
    setSidebarsVisible(!sidebarsVisible);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-center mt-8">
        <h2 className="text-xl font-semibold">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center relative">
      {/* Celebration overlay */}
      <CelebrationOverlay 
        isOpen={showCelebration} 
        confettiProps={{ colors: ['#f00', '#0f0', '#00f'] }} 
      />

      {/* Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-16 bg-gray-800 dark:bg-gray-700 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${sidebarsVisible ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center py-4 space-y-6">
          <Button variant="ghost" className="text-white hover:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Button>
          <Button variant="ghost" className="text-white hover:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-gray-800 dark:bg-gray-700 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${sidebarsVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 text-white">
          <h3 className="text-lg font-semibold text-center mb-4">Log History</h3>
        </div>
      </div>

      {/* Bottom Sidebar */}
      <div className={`fixed bottom-0 left-0 right-0 h-16 bg-gray-800 dark:bg-gray-700 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${sidebarsVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-around items-center h-full text-white">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Reward Points: {pointsEarned}</span>
          </div>
          <Button variant="ghost" className="text-white hover:bg-gray-700 dark:hover:bg-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto p-4 flex-grow flex items-center">
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Welcome {studentUserName}</h2>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 text-center">White Board</h2>
            <div></div> {/* Empty div for spacing */}
          </div>

          <EmojiSelector />
          <ChatRoom
            sessionId={sessionId}
            studentUserName={studentUserName}
            studentUserId={studentUserId}
            isTrainer={false}
            onCorrectAnswer={onCorrectAnswerHandler}
          />

          {/* Sidebar toggle button */}
          <Button 
            variant="ghost"
            onClick={toggleSidebars}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarsVisible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;