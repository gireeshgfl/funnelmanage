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
      const response = await apiClient.post(API_ROUTES.SESSION_SERVICE.SAVE_POINTS, {
        questionId: question.id,
        selectedAnswerIndex: selectedAnswer,
        selectedAnswerText: question.answers[selectedAnswer].text,
        studentUserName,
        studentUserId,
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
    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
      {showResults ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
          <div className="w-full max-w-md bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-600 dark:to-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-primary-500 dark:bg-primary-600 px-4 py-3">
              <h3 className="text-lg font-bold text-white text-center">Submission Results</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                  <svg
                    className={`h-6 w-6 ${pointsEarned > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={pointsEarned > 0 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Points Earned</p>
                  <p className={`text-2xl font-bold ${pointsEarned > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    +{pointsEarned}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Your Answer</p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {selectedAnswerText}
                    {selectedAnswerText === correctAnswerText ? (
                      <span className="ml-2 text-green-500">✓</span>
                    ) : (
                      <span className="ml-2 text-red-500">✗</span>
                    )}
                  </p>
                </div>
                {selectedAnswerText !== correctAnswerText && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-sm border border-green-100 dark:border-green-800/50">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Correct Answer</p>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      {correctAnswerText}
                      <span className="ml-2 text-green-500">✓</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            {question.questionType === 'video-text' ? (
              <>
                <video controls className="w-full max-h-64 rounded-lg mb-4">
                  <source src={question.question} type="video/mp4" />
                </video>
                <p className="text-lg font-medium">{question.questionText}</p>
              </>
            ) : question.questionType === 'image-text' ? (
              <>
                {question.question && (
                  <img
                    src={question.question}
                    alt="Question"
                    className="w-full max-h-64 rounded-lg mb-4 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <p className="text-lg font-medium">{question.questionText}</p>
              </>
            ) : question.questionType === 'image-image' ? (
              <>
                {question.question && (
                  <img
                    src={question.question}
                    alt="Question"
                    className="w-full max-h-64 rounded-lg mb-4 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <p className="text-lg font-medium">{question.questionText}</p>
              </>
            ) : (
              <p className="text-lg font-medium">{question.questionText || question.question}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.answers.map((answer, index) => (
              <div
                key={index}
                className={`p-4 min-h-[120px] rounded-lg cursor-pointer border-2 transition-colors ${selectedAnswer === index
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                onClick={() => handleSelectAnswer(index)}
              >
                {answer.text}
                {question.answerMediaUrls?.[index] && (
                  <img
                    src={question.answerMediaUrls[index]}
                    alt={`Option ${index + 1}`}
                    className="mt-2 max-h-32 w-full object-contain rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="w-full"
            disabled={selectedAnswer === null}
          >
            Submit Answer
          </Button>
        </>
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
  const [activeTab, setActiveTab] = useState('chat');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const chatContainerRef = useRef(null);
  const questionContainerRef = useRef(null);
  const router = useRouter();
  const { sessionId } = useParams();
  const { socket } = useContext(SocketContext);

  const formatQuestion = (questionData, isMCQ = false) => {
    return {
      id: questionData.id || Date.now().toString(),
      question: questionData.question || '',
      questionText: isMCQ ? questionData.question : (questionData.questionText || questionData.question || ''),
      questionType: isMCQ ? 'text' : (questionData.questionType || 'text'),
      answers: Array.isArray(questionData.answers)
        ? questionData.answers.map(answer => typeof answer === 'string' ? { text: answer } : answer)
        : [],
      answerMediaUrls: Array.isArray(questionData.answerMediaUrls) ? questionData.answerMediaUrls : [],
      correctAnswerIndex: isMCQ ? questionData.correctAnswerIndex : undefined
    };
  };

  const addToQueue = (questionData, isMCQ = false) => {
    console.log('Adding to queue:', questionData, 'isMCQ:', isMCQ);
    const formatted = formatQuestion(questionData, isMCQ);
    setQuestionQueue(prev => [...prev, formatted]);
    setActiveTab('question');
  };

  useEffect(() => {
    if (!socket) return;

    // Join the session immediately
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

  // Sync points when socket becomes available
  useEffect(() => {
    if (socket && pointsEarned > 0) {
      console.log('Socket available, syncing points:', pointsEarned);
      socket.emit('updateStudentPoints', { points: pointsEarned });
    }
  }, [socket, pointsEarned]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
    if (activeTab === 'question' && questionContainerRef.current) {
      questionContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

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
      <div className="flex items-center justify-center h-full">
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
    <div className="h-full w-full flex flex-col">
      <CelebrationOverlay
        isOpen={showCelebration}
        confettiProps={{ colors: ['#f00', '#0f0', '#00f'] }}
      />
      <div className="w-full max-w-6xl mx-auto p-4 flex-grow flex items-stretch h-full">
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 relative flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Welcome {studentUserName}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">Reward Points: {pointsEarned}</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/student')}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Exit
              </Button>
            </div>
          </div>
          <div className="flex justify-center mb-4 relative">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 relative w-full max-w-md">
              <div
                className={`absolute top-1 h-[calc(100%-8px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-all duration-300 ease-in-out ${activeTab === 'question'
                  ? 'left-1 w-[calc(50%-4px)]'
                  : 'left-[calc(50%+4px)] w-[calc(50%-8px)]'
                  }`}
              />
              <button
                onClick={() => setActiveTab('question')}
                className={`relative z-10 px-8 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex-1 ${activeTab === 'question'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <span className="relative">
                  Question
                  {(currentQuestion || questionQueue.length > 0) && (
                    <span className="absolute -right-5 -top-2 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                      {questionQueue.length + (currentQuestion ? 1 : 0)}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`relative z-10 px-8 py-3 rounded-md text-sm font-medium transition-colors duration-200 flex-1 ${activeTab === 'chat'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Chats
              </button>
            </div>
          </div>
          <div className="flex-grow flex flex-col overflow-hidden">
            {activeTab === 'question' ? (
              <div
                className="flex-grow overflow-y-auto scrollable-content"
                ref={questionContainerRef}
              >
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
                  <div className="min-h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No active question</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-grow flex flex-col overflow-hidden">
                <EmojiSelector />
                <div
                  className="flex-grow overflow-y-auto scrollable-content"
                  ref={chatContainerRef}
                >
                  <ChatRoom
                    sessionId={sessionId}
                    studentUserName={studentUserName}
                    studentUserId={studentUserId}
                    isTrainer={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;