'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInSessionQuestions } from '@/hooks/session_management/sessionService';
import { ArrowLeft, HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const SessionQuestionsDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { sessionId } = params;

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!sessionId) return;

            try {
                setLoading(true);
                const data = await getInSessionQuestions(sessionId);
                setQuestions(data || []);
            } catch (err) {
                console.error('Error fetching questions:', err);
                setError('Failed to load questions for this session.');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Sessions
                </button>
                <div className="text-center text-red-500 py-12">
                    <p className="text-lg font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Session Questions
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Viewing {questions.length} questions for this session
                        </p>
                    </div>
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Questions Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        This session has no in-session questions recorded.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <div
                            key={question._id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {question.question}
                                    </h3>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                                    {question.type || 'MCQ'}
                                </span>
                            </div>

                            <div className="pl-11 space-y-3">
                                {question.answers && question.answers.map((answer, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${idx === question.correctAnswerIndex
                                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {idx === question.correctAnswerIndex ? (
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                                            ) : (
                                                <div className="h-5 w-5 mr-3 flex-shrink-0" />
                                            )}
                                            <span className={`text-sm ${idx === question.correctAnswerIndex
                                                ? 'text-green-800 dark:text-green-300 font-medium'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {answer.text}
                                            </span>
                                        </div>
                                        {answer.points > 0 && (
                                            <span className={`text-xs px-2 py-1 rounded-full ${idx === question.correctAnswerIndex
                                                ? 'bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300'
                                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                }`}>
                                                {answer.points} pts
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionQuestionsDetailPage;