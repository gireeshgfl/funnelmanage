"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    ChevronDown,
    ChevronUp,
    Calendar,
    User,
    Activity,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useFunnel } from '@/hooks/useFunnel';

const GroupCard = ({ session, students, isOpen, onToggle }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4"
    >
        <div
            onClick={onToggle}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{session.sessionName}</h3>
                    <p className="text-sm text-gray-500 font-medium">Session ID: {session.sessionId}</p>
                </div>
            </div>
            <div className="flex items-center space-x-6">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{students.length} Students</p>
                    <p className="text-xs text-gray-400">Total Enrolled</p>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </div>
        </div>

        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-50 bg-gray-50/30"
                >
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((username, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <User className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{username}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

const SubAdminGroupsPage = () => {
    const { participants, loadingParticipants, error } = useFunnel();
    const [searchQuery, setSearchQuery] = useState('');
    const [openGroups, setOpenGroups] = useState({});

    const toggleGroup = (id) => {
        setOpenGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Group participants by session
    const groupedSessions = participants.reduce((acc, curr) => {
        if (!acc[curr.sessionId]) {
            acc[curr.sessionId] = {
                sessionName: curr.sessionName,
                sessionId: curr.sessionId,
                students: []
            };
        }
        acc[curr.sessionId].students.push(curr.username);
        return acc;
    }, {});

    const sessionList = Object.values(groupedSessions);

    const filteredSessions = sessionList.filter(session =>
        session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sessionId.toString().includes(searchQuery) ||
        session.students.some(student => student.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/dashboard/sub-admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Student Groups</h1>
                        <p className="text-gray-500 mt-1">Manage and view students organized by their sessions.</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by session name, ID or student name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Content */}
                {loadingParticipants ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-500 font-medium animate-pulse">Loading groups and participants...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl text-center">
                        <p className="font-semibold text-lg mb-2">Error Loading Data</p>
                        <p className="text-sm">{error.message || "Something went wrong while fetching participants. Please try again later."}</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="bg-white border border-gray-100 p-12 rounded-2xl text-center shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria to find what you're looking for.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Showing {filteredSessions.length} Groups
                            </p>
                            <div className="flex items-center space-x-2 text-xs font-medium text-gray-400">
                                <Activity className="w-3 h-3" />
                                <span>Live Data from Funnel Service</span>
                            </div>
                        </div>
                        {filteredSessions.map((session) => (
                            <GroupCard
                                key={session.sessionId}
                                session={session}
                                students={session.students}
                                isOpen={openGroups[session.sessionId]}
                                onToggle={() => toggleGroup(session.sessionId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubAdminGroupsPage;
