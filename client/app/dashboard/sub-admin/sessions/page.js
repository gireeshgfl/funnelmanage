"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    User,
    ArrowLeft,
    Search,
    ChevronRight,
    Filter,
    MoreVertical,
    CheckCircle2,
    Timer,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getSessions } from '@/hooks/session_management/sessionService';

const SessionsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getSessions();
                setSessions(data || []);
            } catch (err) {
                console.error('Failed to fetch sessions:', err);
                setError('Failed to load sessions. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Activate':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Deactivate':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'ENDED':
                return 'bg-gray-50 text-gray-700 border-gray-100';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Activate':
                return 'Active';
            case 'Deactivate':
                return 'Inactive';
            case 'ENDED':
                return 'Ended';
            default:
                return status || 'Unknown';
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
        const sessionName = (session.sessionName || '').toLowerCase();
        const matchesSearch = sessionName.includes(searchQuery.toLowerCase());
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
                                <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
                                <p className="text-gray-500 mt-1">Monitor and manage all training activities across groups.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:w-64">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'blue' },
                        { label: 'Active', value: sessions.filter(s => s.status === 'Activate').length, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Ended', value: sessions.filter(s => s.status === 'ENDED').length, icon: AlertCircle, color: 'gray' },
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

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading sessions...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-red-700 font-medium">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 text-red-600 font-semibold hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Sessions List */}
                {!loading && !error && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700">Session Name</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700">Created At</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-sm font-bold text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode='popLayout'>
                                        {filteredSessions.length > 0 ? (
                                            filteredSessions.map((session) => (
                                                <motion.tr
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    key={session._id}
                                                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                                                >
                                                    <td className="px-6 py-5">
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {session.sessionName || 'Untitled Session'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center text-sm text-gray-700">
                                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                            <span>
                                                                {session.created_at
                                                                    ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                                    : '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(session.status)}`}>
                                                            {getStatusIcon(session.status)}
                                                            {getStatusLabel(session.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200">
                                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                            <Search className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                        <p className="text-gray-500 font-medium">No sessions found matching your criteria.</p>
                                                        <button
                                                            onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                                                            className="mt-2 text-blue-600 font-semibold hover:underline"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionsPage;
