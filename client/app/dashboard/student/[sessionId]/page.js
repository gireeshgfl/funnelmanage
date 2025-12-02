'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ChatRoom from '@/components/ChatRoom';
import EmojiSelector from '@/components/EmojiSelector';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { decryptId } from '@/utils/encryption';
import ParticipantsList from '@/components/ParticipantsList';
import { useParticipants } from '@/hooks/useParticipants';

const QuestionDisplay = ({
  question,
  studentUserName,
  studentUserId,
  sessionId,
  selectedAnswer,
  setSelectedAnswer,
  onCorrectAnswer,
  onClearQuestion,
  fetchPoints
}) => {
  const [pointsEarned, setPointsEarned] = useState(null);
  const [selectedAnswerText, setSelectedAnswerText] = useState('');
  const [correctAnswerText, setCorrectAnswerText] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSelectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;

    try {
      const endpoint = question.isInSessionQuestion
        ? API_ROUTES.SESSION_SERVICE.SAVE_SESSION_POINTS
        : API_ROUTES.SESSION_SERVICE.SAVE_POINTS;

      const response = await apiClient.post(endpoint, {
        questionId: question.id,
        selectedAnswerIndex: selectedAnswer,
        selectedAnswerText: question.answers[selectedAnswer].text,
        studentUserName,
        questionText: question.question || question.questionText,
        sessionId,
      });

      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        setPointsEarned(result.data.pointsEarned || 0);
        setSelectedAnswerText(result.data.selectedAnswerText);
        setCorrectAnswerText(result.data.correctAnswerText);
        setShowResults(true);

        if (result.message === "Correct Answer. Points saved successfully") {
          if (onCorrectAnswer) {
            onCorrectAnswer(true);
          }
        }

        await fetchPoints();

        setTimeout(() => {
          setShowResults(false);
          onClearQuestion();
        }, 3000);
      } else {
        console.error('Error in API response:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 flex flex-col">
      {showResults ? (
        <div className="flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-600">
            <div className={`px-6 py-4 ${pointsEarned > 0 ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
              <h3 className="text-xl font-bold text-center">
                {pointsEarned > 0 ? '🎉 Awesome!' : 'Good Try!'}
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center">
                <div className={`p-4 rounded-full mb-4 ${pointsEarned > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pointsEarned > 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">+{pointsEarned} Points</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Answer</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedAnswerText}</p>
                    {selectedAnswerText === correctAnswerText ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </div>
                </div>

                {selectedAnswerText !== correctAnswerText && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Correct Answer</p>
                    <p className="text-green-800 dark:text-green-200 font-medium">{correctAnswerText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="mb-6">
            {question.questionType === 'video-text' ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden shadow-lg bg-black">
                  <video controls className="w-full max-h-[400px] mx-auto">
                    <source src={question.question} type="video/mp4" />
                  </video>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">{question.questionText}</h3>
              </div>
            ) : question.questionType === 'image-text' || question.questionType === 'image-image' ? (
              <div className="space-y-4">
                {question.question && (
                  <div className="rounded-xl overflow-hidden shadow-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                    <img
                      src={question.question}
                      alt="Question"
                      className="w-full max-h-[400px] object-contain mx-auto rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">{question.questionText}</h3>
              </div>
            ) : (
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">{question.questionText || question.question}</h3>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`group relative p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${selectedAnswer === index
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-white dark:hover:bg-gray-700 shadow-sm hover:shadow'
                    }`}
                  onClick={() => handleSelectAnswer(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${selectedAnswer === index
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-gray-300 text-gray-400 group-hover:border-primary-400'
                      }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-grow">
                      <span className={`text-base font-medium ${selectedAnswer === index ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-200'}`}>
                        {answer.text}
                      </span>
                      {question.answerMediaUrls?.[index] && (
                        <img
                          src={question.answerMediaUrls[index]}
                          alt={`Option ${index + 1}`}
                          className="mt-3 max-h-32 w-full object-contain rounded-lg border border-gray-100 dark:border-gray-600"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              variant="primary"
              className="w-full py-4 text-lg font-bold shadow-lg hover:shadow-xl transform transition-all active:scale-95"
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};



const IndexPage = () => {
  const [studentUserName, setStudentUserName] = useState('student');
  const [studentUserId, setStudentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState('question'); // For mobile view mainly
  const [rightPanelTab, setRightPanelTab] = useState('chat'); // For desktop view: 'chat' or 'participants'
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const router = useRouter();
  const params = useParams();
  const sessionId = decryptId(params.sessionId);
  const { socket } = useContext(SocketContext);
  const { participants } = useParticipants(sessionId, socket);

  const formatQuestion = (questionData, isMCQ = false) => {
    return {
      id: questionData._id || questionData.id || Date.now().toString(),
      question: questionData.question || '',
      questionText: isMCQ ? questionData.question : (questionData.questionText || questionData.question || ''),
      questionType: isMCQ ? 'text' : (questionData.questionType || 'text'),
      answers: Array.isArray(questionData.answers)
        ? questionData.answers.map(answer => typeof answer === 'string' ? { text: answer } : answer)
        : [],
      answerMediaUrls: Array.isArray(questionData.answerMediaUrls) ? questionData.answerMediaUrls : [],
      correctAnswerIndex: isMCQ ? questionData.correctAnswerIndex : undefined,
      isInSessionQuestion: isMCQ
    };
  };

  const addToQueue = (questionData, isMCQ = false) => {
    console.log('Adding to queue:', questionData, 'isMCQ:', isMCQ);
    const formatted = formatQuestion(questionData, isMCQ);
    setQuestionQueue(prev => [...prev, formatted]);
    // On mobile, switch to question tab when new question arrives
    if (window.innerWidth < 768) {
      setActiveTab('question');
    }
  };

  useEffect(() => {
    if (!socket) return;

    console.log('Emitting setSessionId for session:', sessionId);
    socket.emit('setSessionId', { sessionId });

    socket.on('pushQuestion', (questionData) => {
      console.log('Received pushQuestion:', questionData);
      addToQueue(questionData, false);
    });

    socket.on('broadcastMCQs', ({ mcqArray, sessionId: receivedSessionId }) => {
      console.log('Received broadcastMCQs:', { mcqArray, sessionId: receivedSessionId });
      if (receivedSessionId === sessionId && mcqArray.length > 0) {
        mcqArray.forEach(mcq => addToQueue(mcq, true));
      }
    });

    return () => {
      socket.off('pushQuestion');
      socket.off('broadcastMCQs');
    };
  }, [socket, sessionId]);

  useEffect(() => {
    if (!currentQuestion && questionQueue.length > 0) {
      const nextQuestion = questionQueue[0];
      setCurrentQuestion(nextQuestion);
      setQuestionQueue(prev => prev.slice(1));
      setSelectedAnswer(null);
    }
  }, [currentQuestion, questionQueue]);

  useEffect(() => {
    if (socket && pointsEarned > 0) {
      console.log('Socket available, syncing points:', pointsEarned);
      socket.emit('updateStudentPoints', { points: pointsEarned });
    }
  }, [socket, pointsEarned]);

  useEffect(() => {
    // Prevent browser from restoring scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Scroll to top on mount with a slight delay to override any auto-scrolls
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClearQuestion = () => {
    setCurrentQuestion(null);
    setSelectedAnswer(null);
  };

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get(API_ROUTES.AUTH_SERVICE.USER);

      if (response.status === 200) {
        const data = response.data;
        setStudentUserName(capitalizeFirstLetter(data.username));
        setStudentUserId(data.user_id);
        await fetchPoints(data.user_id);

        // Save participant to database
        try {
          await apiClient.post(`${API_ROUTES.FUNNEL_SERVICE.SAVE_PARTICIPANTS}`, {
            userId: data.user_id,
            username: data.username,
            sessionId
          });
          console.log('Participant saved successfully');
        } catch (saveError) {
          console.error('Error saving participant:', saveError);
        }
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

  const fetchPoints = async (userId) => {
    try {
      const response = await apiClient.get(API_ROUTES.SESSION_SERVICE.GET_POINTS);

      if (response.status === 200) {
        const data = response.data;
        setPointsEarned(data.pointsEarned);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const onCorrectAnswerHandler = (isCorrect) => {
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

  useEffect(() => {
    fetchUserInfo();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <CelebrationOverlay
        isOpen={showCelebration}
        confettiProps={{ colors: ['#f00', '#0f0', '#00f', '#ff0', '#0ff'] }}
      />

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm z-20 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {studentUserName.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                Hello, {studentUserName}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Emoji Selector */}
            <div className="hidden md:block">
              <EmojiSelector />
            </div>

            {/* Queue Count Display */}
            {questionQueue.length > 0 && (
              <div className="hidden md:flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800/30 shadow-sm animate-pulse">
                <span className="font-bold text-blue-700 dark:text-blue-400 mr-2">Questions in Queue:</span>
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {questionQueue.length}
                </span>
              </div>
            )}

            <div className="hidden md:flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full border border-yellow-100 dark:border-yellow-800/30 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-yellow-700 dark:text-yellow-400">{pointsEarned} Points</span>
            </div>

            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/student')}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Exit Session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {pointsEarned} Points
        </div>
        {questionQueue.length > 0 && (
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/30">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 mr-1">Questions in Queue:</span>
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {questionQueue.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Content - Split Screen */}
      <main className="flex-grow p-4 md:p-6 relative">
        <div className="w-full max-w-[1920px] mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left Column - Question Area */}
          <div className={`md:col-span-7 lg:col-span-7 transition-all duration-300 ${activeTab === 'question' ? 'block' : 'hidden md:block'}`}>
            {currentQuestion ? (
              <QuestionDisplay
                key={currentQuestion.id}
                question={currentQuestion}
                studentUserName={studentUserName}
                studentUserId={studentUserId}
                sessionId={sessionId}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
                onCorrectAnswer={onCorrectAnswerHandler}
                onClearQuestion={handleClearQuestion}
                fetchPoints={fetchPoints}
              />
            ) : (
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Waiting for Question</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  The trainer hasn't pushed a question yet. Sit tight and get ready!
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Chat & Participants Area */}
          <div className={`md:col-span-5 lg:col-span-5 transition-all duration-300 ${activeTab === 'chat' || activeTab === 'participants' ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col overflow-hidden sticky top-6">

              {/* Desktop Tabs */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={() => setRightPanelTab('chat')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${rightPanelTab === 'chat'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    Chat Room
                  </button>
                  <button
                    onClick={() => setRightPanelTab('participants')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${rightPanelTab === 'participants'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    Participants
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-hidden relative">
                {/* Mobile: Show based on activeTab */}
                {/* Desktop: Show based on rightPanelTab */}
                <div className={`h-full ${(window.innerWidth < 768 && activeTab === 'chat') || (window.innerWidth >= 768 && rightPanelTab === 'chat')
                  ? 'block'
                  : 'hidden'
                  }`}>
                  <ChatRoom
                    sessionId={sessionId}
                    studentUserName={studentUserName}
                    studentUserId={studentUserId}
                    isTrainer={false}
                  />
                </div>

                <div className={`h-full ${(window.innerWidth < 768 && activeTab === 'participants') || (window.innerWidth >= 768 && rightPanelTab === 'participants')
                  ? 'block'
                  : 'hidden'
                  }`}>
                  <ParticipantsList currentSessionId={sessionId} participants={participants} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex sticky bottom-0 z-50">
        <button
          onClick={() => setActiveTab('question')}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${activeTab === 'question' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <div className="relative">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {(currentQuestion || questionQueue.length > 0) && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </div>
          <span className="text-xs font-medium">Question</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${activeTab === 'chat' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-xs font-medium">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${activeTab === 'participants' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-xs font-medium">Participants</span>
        </button>
      </div>
    </div>
  );
};

export default IndexPage;