"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    User,
    ArrowLeft,
    Search,
    CheckCircle2,
    Timer,
    AlertCircle,
    Loader2,
    Mail,
    BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { getSessions } from '@/hooks/session_management/sessionService';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';

const SessionsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // Fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getSessions();
                setSessions(data || []);
            } catch (err) {
                console.error('Failed to fetch sessions:', err);
                setError('Failed to load sessions.');
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    // Fetch participants (students only) — avoids unnecessary groups call
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setStudentsLoading(true);
                const response = await apiClient.get(API_ROUTES.QUESTION_SERVICE.GET_PARTICIPANTS);
                if (response.data?.status === 200 && response.data?.data) {
                    setStudents(response.data.data.students || []);
                }
            } catch (err) {
                console.error('Failed to fetch participants:', err);
            } finally {
                setStudentsLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Activate':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Deactivate':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'ENDED':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Activate': return 'Active';
            case 'Deactivate': return 'Inactive';
            case 'ENDED': return 'Ended';
            default: return status || 'Unknown';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Activate':
                return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
            case 'Deactivate':
                return <Timer className="w-3.5 h-3.5 mr-1" />;
            case 'ENDED':
                return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
            default:
                return null;
        }
    };

    const filteredSessions = sessions.filter(session => {
        const name = (session.sessionName || '').toLowerCase();
        const topic = (session.topic || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch = name.includes(q) || topic.includes(q);
        const matchesStatus = statusFilter === 'All' || session.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link
                            href="/dashboard/sub-admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
                                <p className="text-gray-500 mt-1">Request trainers to add students to sessions.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                        >
                            <option value="All">All Status</option>
                            <option value="Activate">Active</option>
                            <option value="Deactivate">Inactive</option>
                            <option value="ENDED">Ended</option>
                        </select>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'blue' },
                        { label: 'Active', value: sessions.filter(s => s.status === 'Activate').length, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Ended', value: sessions.filter(s => s.status === 'ENDED').length, icon: AlertCircle, color: 'gray' },
                        { label: 'Total Students', value: students.length, icon: Users, color: 'violet' },
                    ].map((stat, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={stat.label}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Side by Side: Sessions & Students */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sessions List */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Sessions</h2>
                            <span className="text-sm text-gray-500">({filteredSessions.length})</span>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16 flex-1">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center py-16 px-6 flex-1">
                                <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                                <p className="text-red-700 font-medium text-sm text-center">{error}</p>
                            </div>
                        ) : filteredSessions.length > 0 ? (
                            <div className="overflow-y-auto max-h-[520px] flex-1">
                                {filteredSessions.map((session, index) => (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        key={session._id}
                                        className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {session.sessionName || 'Untitled Session'}
                                                </p>
                                                {session.topic && (
                                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                                        <BookOpen className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                                        <span className="truncate">{session.topic}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    {session.date && (
                                                        <span className="flex items-center text-xs text-gray-400">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {session.time && (
                                                        <span className="flex items-center text-xs text-gray-400">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {session.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusStyles(session.status)}`}>
                                                {getStatusIcon(session.status)}
                                                {getStatusLabel(session.status)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-16 flex-1">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <Search className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">No sessions found.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                                    className="mt-2 text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Students List */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center space-x-3">
                            <div className="p-2 bg-violet-50 rounded-lg">
                                <Users className="w-5 h-5 text-violet-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Students</h2>
                            <span className="text-sm text-gray-500">({students.length})</span>
                        </div>
                        {studentsLoading ? (
                            <div className="flex items-center justify-center py-16 flex-1">
                                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                            </div>
                        ) : students.length > 0 ? (
                            <div className="overflow-y-auto max-h-[520px] flex-1">
                                {students.map((student, index) => (
                                    <div
                                        key={student._id || index}
                                        className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex items-center gap-4"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-violet-600">
                                                {(student.fullName || student.email || '?').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {student.fullName || 'Unknown'}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{student.email || '—'}</span>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 text-xs font-medium flex-shrink-0">
                                            Student
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-16 flex-1">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <Users className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium text-sm">No students found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionsPage;
