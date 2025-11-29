"use client";

import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';
import { ArrowLeft, CheckCircle, Image, Video, Save, Send, Tag, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { decryptId } from '@/utils/encryption';

const QuestionBank = () => {
  const params = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const { socket } = useContext(SocketContext);
  const [points, setPoints] = useState({});

  useEffect(() => {
    const id = decryptId(params.sessionId);
    if (id) {
      fetchSessionData(id);
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (selectedTopic) {
      fetchQuestions(selectedTopic.id);
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (questions.length > 0) {
      const initialPoints = {};
      questions.forEach((q, idx) => {
        initialPoints[idx] = q.points || Array(q.answers.length).fill(0);
      });
      setPoints(initialPoints);
    }
  }, [questions]);

  const fetchSessionData = async (id) => {
    try {
      const response = await apiClient.get(`${API_ROUTES.SESSION_SERVICE.GET_QUESTION_TOPICS}?id=${id}`);
      const { data } = response.data;
      setSessionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (topicId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_ROUTES.QUESTION_SERVICE.GET_QUESTIONS}?id=${topicId}`);
      const { data } = response.data;
      setQuestions(data);
      fetchPushedStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPushedStatus = async (questions) => {
    if (!Array.isArray(questions)) return;

    try {
      const response = await apiClient.get(`${API_ROUTES.SESSION_SERVICE.GET_PUSHED_QUESTIONS}?id=${decryptId(params.sessionId)}`);

      if (response.status === 200 || response.status === 201) {
        // Handle potential variations in response structure
        let pushedQuestions = [];
        if (Array.isArray(response.data)) {
          pushedQuestions = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          pushedQuestions = response.data.data;
        } else {
          console.warn('fetchPushedStatus: Unexpected response format:', response.data);
        }

        const updatedQuestions = questions.map(q => ({
          ...q,
          isPushed: pushedQuestions.some(p => p.questionId && String(p.questionId) === String(q._id))
        }));

        setQuestions(updatedQuestions);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // 404 means no pushed questions found, which is a valid state
        const updatedQuestions = questions.map(q => ({ ...q, isPushed: false }));
        setQuestions(updatedQuestions);
      } else {
        console.error('Error fetching pushed status:', err);
      }
    }
  };

  const handleSavePoints = async (questionIdx) => {
    try {
      const response = await apiClient.put(API_ROUTES.QUESTION_SERVICE.UPDATE_QUESTION, {
        _id: questions[questionIdx]._id,
        points: points[questionIdx]
      });
      if (response.status === 200 || response.status === 201) {
        setQuestions(prev => prev.map((q, idx) =>
          idx === questionIdx ? { ...q, points: points[questionIdx] } : q
        ));
      }
    } catch (err) {
      console.error('Error saving points:', err);
    }
  };

  const handlePushQuestion = async (question) => {
    if (!socket) return;

    const questionData = {
      id: question._id,
      question: question.question,
      questionText: question.questionText,
      questionType: question.questionType,
      answerMediaUrls: question.answerMediaUrls || [],
      answers: question.answers,
    };

    socket.emit('pushQuestion', questionData);

    try {
      await apiClient.post(API_ROUTES.SESSION_SERVICE.SAVE_PUSHED_QUESTIONS, {
        topicId: selectedTopic.id,
        questionId: question._id,
        sessionId: decryptId(params.sessionId),
      });
      setQuestions(prev => prev.map(q =>
        q._id === question._id ? { ...q, isPushed: true } : q
      ));
    } catch (err) {
      console.error('Error saving pushed status:', err);
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
      <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (selectedTopic) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={() => setSelectedTopic(null)}
            variant="outline"
            icon={<ArrowLeft size={16} />}
            className="mb-6"
          >
            Back to Topics
          </Button>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="relative p-6 bg-gradient-to-r from-primary-600 to-secondary-500 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {selectedTopic.name}
                  <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                  </span>
                </h2>
                <p className="text-sm text-white/90 mt-1">{selectedTopic.description}</p>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {questions.length > 0 ? (
                questions.map((question, qIdx) => (
                  <motion.div
                    key={question._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: qIdx * 0.05 }}
                    className={`p-6 ${question.isPushed ? 'bg-green-100 dark:bg-green-900/40' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {question.questionType === 'video-text' ? (
                        <Video className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                      ) : question.questionType === 'image-text' ? (
                        <Image className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                      ) : null}

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            {qIdx + 1}. {question.questionType === 'text-text' ? question.question : question.questionText}
                          </h3>
                          {question.isPushed && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              Pushed
                            </span>
                          )}
                        </div>

                        {question.questionType !== 'text-text' && (
                          <div className="mt-2">
                            {question.questionType === 'video-text' ? (
                              <video controls className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700">
                                <source src={question.question} type="video/mp4" />
                              </video>
                            ) : (
                              <img
                                src={question.question}
                                alt="Question media"
                                className="max-w-md max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                            )}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Tag className="h-4 w-4" />
                            <span>Answers</span>
                          </div>

                          {question.answers?.map((answer, aIdx) => (
                            <div key={aIdx} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${aIdx === question.correctAnswerIndex
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300 dark:border-gray-600'
                                  }`}>
                                  {aIdx === question.correctAnswerIndex && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{answer}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Points:</span>
                                <Input
                                  type="number"
                                  value={points[qIdx]?.[aIdx] || 0}
                                  onChange={(e) => {
                                    const newPoints = [...points[qIdx]];
                                    newPoints[aIdx] = parseInt(e.target.value) || 0;
                                    setPoints({ ...points, [qIdx]: newPoints });
                                  }}
                                  className="w-20"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePushQuestion(question)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-white ${question.isPushed
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-primary-500 hover:bg-primary-600'
                              }`}
                          >
                            <Send className="h-4 w-4" />
                            {question.isPushed ? 'Push Again' : 'Push to Session'}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSavePoints(qIdx)}
                            className="px-4 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 dark:bg-primary-900/30 dark:hover:bg-primary-800/50 dark:text-primary-300 text-sm font-medium flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save Points
                          </motion.button>
                        </div>

                        {question.questionType === 'image-image' && question.answerMediaUrls?.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {question.answerMediaUrls.map((url, idx) => (
                              <div key={idx} className="text-center">
                                <img
                                  src={url}
                                  alt={`Answer ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                                <p className="text-sm mt-2 font-medium">{question.answers[idx]}</p>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                  {points[qIdx]?.[idx]} points
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No questions available for this topic
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Question Bank Topics
        </h2>

        {sessionData?.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessionData.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                  className="p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                        <MessageCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{topic.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Difficulty: {topic.difficulty}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            No question topics available for this session
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuestionBank;