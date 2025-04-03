"use client";

import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input, Radio } from '@components/ui/components';
import { API_ROUTES } from '@/config';
import { SocketContext } from '@/context/socketContext';

const QuestionBank = () => {
  const params = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestionData, setSelectedQuestionData] = useState(null);
  const { socket } = useContext(SocketContext);
  const [questionPoints, setQuestionPoints] = useState({});
  const [topicId, setTopicId] = useState(null);

  useEffect(() => {
    const id = params.sessionId;
    if (id) {
      fetchSessionData(id);
    } else {
      setError('No session ID provided in the URL');
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (selectedQuestionData && selectedQuestionData.questions) {
      const initialPoints = {};
      selectedQuestionData.questions.forEach((question, index) => {
        initialPoints[index] = question.points || Array(question.answers.length).fill(0);
      });
      setQuestionPoints(initialPoints);
    }
  }, [selectedQuestionData]);

  const fetchSessionData = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_QUESTION_TOPICS}?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.data && data.status === 200) {
        setSessionData(data.data);
        if (data.data.length > 0) {
          setTopicId(data.data[0].id);
        }
      } else {
        setError('No questions available for this session.');
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionData = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.GET_QUESTIONS}?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch question data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSelectedQuestionData(prev => ({ ...prev, questions: data.data }));
      fetchPushedQuestions();
    } catch (err) {
      console.error('Error fetching question data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPushedQuestions = async () => {
    try {
      const response = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_PUSHED_QUESTIONS}?id=${params.sessionId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedQuestionData(prev => {
          if (!prev || !prev.questions) return prev;
          const updatedQuestions = prev.questions.map(q => {
            const pushed = result.data.find(p => p.questionId === q._id);
            return pushed ? { ...q, broadcast_status: pushed.broadcast_status } : q;
          });
          return { ...prev, questions: updatedQuestions };
        });
      }
    } catch (err) {
      console.error('Error fetching pushed questions:', err);
    }
  };

  const postPushedQuestion = async (questionId) => {
    try {
      const response = await fetch(`${API_ROUTES.SESSION_SERVICE.SAVE_PUSHED_QUESTIONS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: topicId,
          questionId: questionId,
          sessionId: params.sessionId,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to post pushed question data: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error posting pushed question data:', err);
    }
  };

  const handleViewQuestions = (topic) => {
    setTopicId(topic.id);
    setSelectedQuestionData({ topic, questions: null });
    fetchQuestionData(topic.id);
  };

  const handleBackToList = () => {
    setSelectedQuestionData(null);
  };

  const handlePointsChange = (questionIndex, answerIndex, value) => {
    setQuestionPoints(prev => {
      const newPoints = [...prev[questionIndex]];
      newPoints[answerIndex] = parseInt(value) || 0;
      return { ...prev, [questionIndex]: newPoints };
    });
  };

  const handleSavePoints = async (questionIndex) => {
    setLoading(true);
    try {
      const updatedPoints = questionPoints[questionIndex];
      const questionId = selectedQuestionData.questions[questionIndex]._id;
      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.UPDATE_QUESTION}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          _id: questionId,
          points: updatedPoints 
        }),
      });
      if (!response.ok) {
        throw new Error(`Error updating question: ${response.statusText}`);
      }
      setSelectedQuestionData(prev => {
        const newQuestions = prev.questions.map((question, index) => {
          if (index === questionIndex) {
            return { ...question, points: updatedPoints };
          }
          return question;
        });
        return { ...prev, questions: newQuestions };
      });
    } catch (err) {
      console.error('Error saving points:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePushQuestion = (question) => {
    if (socket) {
      const questionData = {
        id: question._id,
        question: question.question,
        questionText: question.questionText,
        questionType: question.questionType,
        answerMediaUrls: question.answerMediaUrls || [],
        answers: question.answers,
      };
      socket.emit('pushQuestion', questionData);
      postPushedQuestion(question._id);
      setSelectedQuestionData(prev => {
        const updatedQuestions = prev.questions.map(q =>
          q._id === question._id ? { ...q, broadcast_status: 'pushed' } : q
        );
        return { ...prev, questions: updatedQuestions };
      });
    }
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
      <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (selectedQuestionData) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <Button 
          onClick={handleBackToList} 
          variant="outline"
          className="mb-4 w-full md:w-auto"
        >
          Back to List
        </Button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {selectedQuestionData.topic.name || "Questions"}
            </h2>
          </div>
          
          <div className="h-[calc(100vh-200px)] overflow-y-auto p-4">
            {selectedQuestionData.questions?.length > 0 ? (
              selectedQuestionData.questions.map((questionObj, questionIndex) => {
                const { _id, question, questionText, questionType, answers, correctAnswerIndex, broadcast_status, answerMediaUrls } = questionObj;
                const isPushed = broadcast_status === 'pushed';
                
                return (
                  <div 
                    key={_id} 
                    className={`mb-6 p-4 rounded-lg border ${isPushed 
                      ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                  >
                    {questionType === 'text-text' ? (
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                        {questionIndex + 1}. {question}
                      </h3>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {questionIndex + 1}.
                        </h3>
                        <div className="mt-2">
                          {questionType === 'video-text' ? (
                            <video controls className="max-w-xs max-h-48 rounded">
                              <source src={question} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img 
                              src={question} 
                              alt="Question media" 
                              className="max-w-xs max-h-48 rounded mb-2" 
                            />
                          )}
                          {questionText && <p className="text-gray-700 dark:text-gray-300">{questionText}</p>}
                        </div>
                      </>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      {Array.isArray(answers) ? answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 flex-1">
                            <Radio
                              checked={answerIndex === correctAnswerIndex}
                              readOnly
                            />
                            <span className="text-gray-700 dark:text-gray-300">{answer}</span>
                          </label>
                          <Input
                            type="number" 
                            value={questionPoints[questionIndex]?.[answerIndex] || 0} 
                            onChange={(e) => handlePointsChange(questionIndex, answerIndex, e.target.value)}
                            className="w-20 ml-2"
                          />
                        </div>
                      )) : <p className="text-gray-500 dark:text-gray-400">No answers available</p>}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        onClick={() => handlePushQuestion(questionObj)}
                        variant="primary"
                        className="flex-1 min-w-[120px]"
                      >
                        Push Question
                      </Button>
                      <Button 
                        onClick={() => handleSavePoints(questionIndex)}
                        variant="secondary"
                        className="flex-1 min-w-[120px]"
                      >
                        Save Points
                      </Button>
                    </div>
                    
                    {questionType === 'image-image' && answerMediaUrls && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {answerMediaUrls.map((url, index) => (
                          <div key={index} className="text-center">
                            <img 
                              src={url} 
                              alt={`Answer ${index + 1}`} 
                              className="max-w-full h-24 mx-auto rounded" 
                            />
                            {answers[index] && (
                              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {answers[index]}
                              </div>
                            )}
                            <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                              Points: {questionObj.points?.[index] || 0}{index === correctAnswerIndex ? ' (Correct)' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No questions available.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      {sessionData?.length > 0 ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {sessionData.map((topic) => (
            <div 
              key={topic.id} 
              className="flex flex-col md:flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 truncate">
                  {topic.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Difficulty: {topic.difficulty}
                </p>
              </div>
              <Button 
                onClick={() => handleViewQuestions(topic)}
                variant="primary"
                className="mt-2 md:mt-0 md:ml-4 w-full md:w-auto"
              >
                View Questions
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-center">
          No questions available for this session.
        </div>
      )}
    </div>
  );
};

export default QuestionBank;