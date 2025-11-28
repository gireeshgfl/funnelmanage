'use client';
import React, { useEffect, useState } from 'react';
import { getSessionsWithQuestions } from '@/hooks/session_management/sessionService';
import { Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SessionQuestionsPage = () => {
    const router = useRouter();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                const data = await getSessionsWithQuestions();
                setSessions(data || []);
            } catch (err) {
                console.error('Error fetching sessions:', err);
                setError('Failed to load sessions with questions.');
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const formatSessionDate = (session) => {
        if (!session.date) return 'Date not set';
        try {
            return new Date(session.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading sessions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Sessions with Questions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View all sessions that have in-session questions.
                    </p>
                </div>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Sessions Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        There are no sessions with in-session questions at the moment.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div
                            key={session._id}
                            onClick={() => router.push(`/dashboard/trainer/question-bank/question-database/session-questions/${session._id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                        <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'Activate'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {session.status === 'Activate' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                    {session.sessionName || 'Untitled Session'}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <span className="font-medium mr-2">Date:</span>
                                        {formatSessionDate(session)}
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-medium mr-2">Topic:</span>
                                        {session.topic || 'No topic'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionQuestionsPage;
