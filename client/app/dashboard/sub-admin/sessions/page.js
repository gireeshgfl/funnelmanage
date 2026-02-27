"use client";

import React, { useState } from 'react';
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
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const SessionsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Mock Data
    const sessions = [
        {
            id: 1,
            title: "Advanced React Patterns",
            group: "Frontend Batch A",
            trainer: "Sarah Johnson",
            date: "2024-03-20",
            time: "10:00 AM - 12:00 PM",
            status: "Upcoming",
            students: 24
        },
        {
            id: 2,
            title: "System Design Fundamentals",
            group: "Backend Batch B",
            trainer: "David Chen",
            date: "2024-03-19",
            time: "02:00 PM - 04:00 PM",
            status: "Ongoing",
            students: 18
        },
        {
            id: 3,
            title: "Introduction to Node.js",
            group: "Fullstack Batch C",
            trainer: "Michael Ross",
            date: "2024-03-18",
            time: "11:00 AM - 01:00 PM",
            status: "Completed",
            students: 22
        },
        {
            id: 4,
            title: "Database Optimization",
            group: "Data Science Group",
            trainer: "Elena Rodriguez",
            date: "2024-03-21",
            time: "09:00 AM - 11:00 AM",
            status: "Upcoming",
            students: 15
        },
        {
            id: 5,
            title: "Mobile App Development with Expo",
            group: "Mobile Dev Team",
            trainer: "Alex Kim",
            date: "2024-03-17",
            time: "03:00 PM - 05:00 PM",
            status: "Completed",
            students: 20
        }
    ];

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Upcoming':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Ongoing':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Upcoming':
                return <Timer className="w-3.5 h-3.5 mr-1" />;
            case 'Ongoing':
                return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
            case 'Completed':
                return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
            default:
                return null;
        }
    };

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.group.toLowerCase().includes(searchQuery.toLowerCase());
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
                            <option value="Upcoming">Upcoming</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'blue' },
                        { label: 'Upcoming', value: sessions.filter(s => s.status === 'Upcoming').length, icon: Timer, color: 'amber' },
                        { label: 'Completed', value: sessions.filter(s => s.status === 'Completed').length, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Total Students', value: sessions.reduce((acc, s) => acc + s.students, 0), icon: Users, color: 'primary' },
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

                {/* Sessions List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Session Details</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Group & Trainer</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Schedule</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {filteredSessions.length > 0 ? (
                                        filteredSessions.map((session, index) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                key={session.id}
                                                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                                            >
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {session.title}
                                                        </p>
                                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                                            <Users className="w-3.5 h-3.5 mr-1" />
                                                            {session.students} Students Enrolled
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-700">
                                                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                                                            <span className="font-medium">{session.group}</span>
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <User className="w-4 h-4 mr-2 text-gray-400" />
                                                            {session.trainer}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-700">
                                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                            <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                            {session.time}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(session.status)}`}>
                                                        {getStatusIcon(session.status)}
                                                        {session.status}
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
                                            <td colSpan="5" className="px-6 py-12 text-center">
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
            </div>
        </div>
    );
};

export default SessionsPage;
