'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Loader2, Clock, CheckCircle2, XCircle, RefreshCw, User, Calendar, Search, Filter } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

export default function AdminRequestsPage() {
    const { fetchStudentSessionRequests, loading, error } = useGroups({ fetchOnMount: false });
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadRequests = useCallback(async () => {
        const data = await fetchStudentSessionRequests();
        setRequests(data || []);
    }, [fetchStudentSessionRequests]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadRequests();
        setIsRefreshing(false);
    };

    const getStatusBadge = (status) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'approved' || normalized === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approved
                </span>
            );
        }
        if (normalized === 'rejected' || normalized === 'denied') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <XCircle className="h-3.5 w-3.5" />
                    Rejected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Clock className="h-3.5 w-3.5" />
                Pending
            </span>
        );
    };

    const filteredRequests = requests.filter((req) => {
        const studentName = req.student_name || req.studentName || req.student_id || '';
        const sessionName = req.session_name || req.sessionName || req.session_id || '';
        const matchesSearch =
            studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sessionName.toLowerCase().includes(searchQuery.toLowerCase());

        const status = (req.status || 'pending').toLowerCase();
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'pending' && (status === 'pending' || status === '')) ||
            (statusFilter === 'approved' && (status === 'approved' || status === 'accepted')) ||
            (statusFilter === 'rejected' && (status === 'rejected' || status === 'denied'));

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary-600" />
                        Admin Requests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Track your session student requests and their status.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by student or session..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    />
                </div>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${statusFilter === filter
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                    {typeof error === 'string' ? error : error.message || 'Failed to load requests.'}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Student</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Session</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading && requests.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                                            <p className="text-sm">Loading requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <ClipboardList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">No requests found</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {searchQuery || statusFilter !== 'all'
                                                        ? 'Try adjusting your filters.'
                                                        : 'Your session requests will appear here.'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req, index) => {
                                    const reqId = req._id || req.id || index;
                                    const studentName = req.student_name || req.studentName || req.student_id || 'Unknown';
                                    const sessionName = req.session_name || req.sessionName || req.session_id || 'Unknown';
                                    const createdAt = req.created_at || req.createdAt || req.date;

                                    return (
                                        <tr
                                            key={reqId}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {studentName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {sessionName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {createdAt
                                                    ? new Date(createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(req.status)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Footer */}
            {!loading && requests.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                    <span>
                        Showing {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                        {requests.filter(r => (r.status || '').toLowerCase() === 'pending' || !r.status).length} pending
                    </span>
                </div>
            )}
        </div>
    );
}
