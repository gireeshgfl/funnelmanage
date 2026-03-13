"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    ArrowLeft,
    GraduationCap,
    Mail,
    Calendar,
    Filter,
    ChevronRight,
    SearchX,
    LayoutGrid,
    BookOpen,
    UserCheck,
    CheckCircle2,
    Phone,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useGroups } from '@/hooks/useGroups';

const StudentsPage = () => {
    const { attemptedStudents, fetchAttemptedStudents, loading, error: apiError } = useGroups({ fetchOnMount: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('All Time'); // 'All Time', 'Last 7 Days', 'Last 30 Days', 'This Year', 'Custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('All'); // 'All', 'Attended', 'Missed'
    const [groupFilter, setGroupFilter] = useState('All Groups');

    useEffect(() => {
        fetchAttemptedStudents();
    }, [fetchAttemptedStudents]);

    // Map real data to UI format
    const studentsData = attemptedStudents.map((s, index) => ({
        id: s.studentId || `student-${index}`,
        name: s.studentName,
        email: s.email,
        phone: s.phone,
        group: s.groupName,
        status: 'Active', // Default status as it's not in the API yet
        lastActive: 'Recently',
        enrollmentDate: s.created_at || null, // Use created_at from API
        attendanceStatus: s.status, // "Attended" or "Missed"
        progress: s.status === 'Attended' ? 100 : 0,
        avatar: s.studentName?.split(' ').map(n => n[0]).join('') || 'U'
    }));

    const uniqueGroups = ['All Groups', ...new Set(studentsData.map(s => s.group).filter(Boolean))];

    const filteredStudents = studentsData.filter(student => {
        const matchesSearch =
            (student.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (student.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (student.group?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (student.phone?.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        // Attendance Status Filter
        if (attendanceFilter !== 'All' && student.attendanceStatus !== attendanceFilter) {
            return false;
        }

        // Group Filter
        if (groupFilter !== 'All Groups' && student.group !== groupFilter) {
            return false;
        }

        // Date Filter
        if (dateFilter !== 'All Time') {
            if (!student.enrollmentDate) return false;

            const studentDate = new Date(student.enrollmentDate);
            const now = new Date();

            if (dateFilter === 'Last 7 Days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                if (studentDate < sevenDaysAgo) return false;
            } else if (dateFilter === 'Last 30 Days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                if (studentDate < thirtyDaysAgo) return false;
            } else if (dateFilter === 'This Year') {
                if (studentDate.getFullYear() !== now.getFullYear()) return false;
            } else if (dateFilter === 'Custom') {
                if (customStartDate) {
                    const start = new Date(customStartDate);
                    start.setHours(0, 0, 0, 0);
                    if (studentDate < start) return false;
                }
                if (customEndDate) {
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    if (studentDate > end) return false;
                }
            }
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-transparent p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link
                            href="/dashboard/sub-admin"
                            className="inline-flex items-center text-sm text-gray-400 hover:text-blue-500 transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Attendance</h1>
                                <p className="text-gray-500 mt-1">Monitor and track attendance records for all students across sessions.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or group..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium"
                                />
                            </div>

                            {/* Attendance Toggle */}
                            <div className="flex bg-gray-50/50 p-1 rounded-2xl border border-gray-100 w-full md:w-auto self-stretch">
                                {['All', 'Attended', 'Missed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setAttendanceFilter(status)}
                                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${attendanceFilter === status
                                            ? 'bg-white text-blue-600 shadow-sm border border-gray-100 scale-[1.02]'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 w-full lg:w-auto">
                            <div className="relative flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 group w-full md:w-48">
                                <Users className="w-4 h-4 ml-2 text-gray-400" />
                                <select
                                    value={groupFilter}
                                    onChange={(e) => setGroupFilter(e.target.value)}
                                    className="bg-transparent pl-2 pr-8 py-2 text-xs font-bold text-gray-700 outline-none appearance-none cursor-pointer w-full"
                                >
                                    {uniqueGroups.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                                <ChevronRight className="w-4 h-4 mr-2 text-gray-400 rotate-90 absolute right-2 pointer-events-none" />
                            </div>

                            {dateFilter === 'Custom' && (
                                <div className="flex items-center space-x-2 w-full md:w-auto">
                                    <div className="flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 flex-1 md:flex-none">
                                        <Calendar className="w-3.5 h-3.5 mx-2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold text-gray-700 outline-none w-full md:w-28"
                                        />
                                    </div>
                                    <span className="text-gray-400 text-[10px] font-black uppercase">To</span>
                                    <div className="flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 flex-1 md:flex-none">
                                        <Calendar className="w-3.5 h-3.5 mx-2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="bg-transparent text-[10px] font-bold text-gray-700 outline-none w-full md:w-28"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="relative flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 group w-full md:w-48">
                                <Filter className="w-4 h-4 ml-2 text-gray-400" />
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="bg-transparent pl-2 pr-8 py-2 text-xs font-bold text-gray-700 outline-none appearance-none cursor-pointer w-full"
                                >
                                    <option value="All Time">All Time</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                    <option value="Last 30 Days">Last 30 Days</option>
                                    <option value="This Year">This Year</option>
                                    <option value="Custom">Custom Range</option>
                                </select>
                                <ChevronRight className="w-4 h-4 mr-2 text-gray-400 rotate-90 absolute right-2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(searchQuery || dateFilter !== 'All Time' || attendanceFilter !== 'All' || groupFilter !== 'All Groups') && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Active Filters:</span>
                            {searchQuery && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100 flex items-center"
                                >
                                    Search: {searchQuery}
                                    <button onClick={() => setSearchQuery('')} className="ml-2 hover:text-blue-800">×</button>
                                </motion.div>
                            )}
                            {attendanceFilter !== 'All' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center ${attendanceFilter === 'Attended'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}
                                >
                                    Status: {attendanceFilter}
                                    <button onClick={() => setAttendanceFilter('All')} className="ml-2 hover:opacity-70">×</button>
                                </motion.div>
                            )}
                            {groupFilter !== 'All Groups' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black border border-purple-100 flex items-center"
                                >
                                    Group: {groupFilter}
                                    <button onClick={() => setGroupFilter('All Groups')} className="ml-2 hover:text-purple-800">×</button>
                                </motion.div>
                            )}
                            {dateFilter !== 'All Time' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 flex items-center"
                                >
                                    {dateFilter === 'Custom'
                                        ? `Date: ${customStartDate || 'Start'} to ${customEndDate || 'End'}`
                                        : `Date: ${dateFilter}`}
                                    <button onClick={() => {
                                        setDateFilter('All Time');
                                        setCustomStartDate('');
                                        setCustomEndDate('');
                                    }} className="ml-2 hover:text-indigo-800">×</button>
                                </motion.div>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setDateFilter('All Time');
                                    setAttendanceFilter('All');
                                    setGroupFilter('All Groups');
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }}
                                className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest ml-2"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Display Grid */}
                <div className="relative min-h-[400px]">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20 rounded-[40px] backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Fetching Attendance Records...</p>
                            </div>
                        </div>
                    )}

                    {apiError && (
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] mb-8 flex items-center gap-4 text-rose-600">
                            <div className="p-3 bg-rose-100 rounded-2xl">
                                <SearchX className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-wider text-xs">Error Fetching Data</h3>
                                <p className="text-sm font-medium opacity-80">{apiError}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-white -mr-8 -mt-8 rounded-full z-0 group-hover:from-blue-50 transition-colors" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30">
                                                    {student.avatar}
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${student.attendanceStatus === 'Attended'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                    {student.attendanceStatus}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {student.name}
                                                    </h3>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center text-gray-400 text-xs mt-1 font-bold">
                                                            <Mail className="w-3 h-3 mr-1.5" />
                                                            {student.email}
                                                        </div>
                                                        <div className="flex items-center text-gray-400 text-xs font-bold">
                                                            <Phone className="w-3 h-3 mr-1.5" />
                                                            {student.phone}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 space-y-3">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Group</span>
                                                        <span className="text-gray-800 font-black">{student.group}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${student.progress}%` }}
                                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date</span>
                                                            <span className="text-xs text-gray-700 font-black">
                                                                {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-100" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Active</span>
                                                            <span className="text-xs text-gray-700 font-black">{student.lastActive}</span>
                                                        </div>
                                                    </div>
                                                    <button className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <ViewPlaceholder type="students" />
                            )}
                        </AnimatePresence>
                    </div>
                    <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f1;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

const ViewPlaceholder = ({ type }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-gray-200"
    >
        <div className="p-6 bg-gray-50 rounded-full mb-6">
            <SearchX className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">No {type} found</h3>
        <p className="text-gray-500 font-medium max-w-xs text-center">
            We couldn't find any {type} matching your search query.
        </p>
    </motion.div>
);

export default StudentsPage;
