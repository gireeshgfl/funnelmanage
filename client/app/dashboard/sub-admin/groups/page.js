"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    User,
    ArrowLeft,
    GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';

const GroupsPage = () => {
    const [data, setData] = useState({ trainers: [], students: [], others: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await apiClient.get(API_ROUTES.QUESTION_SERVICE.GET_PARTICIPANTS);
                if (response.data?.status === 200 && response.data?.data) {
                    setData(response.data.data);
                } else {
                    throw new Error("Failed to load participants data");
                }
            } catch (err) {
                console.error("Error fetching participants:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, []);

    const filteredStudents = data.students.filter(p =>
        (p.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href="/dashboard/sub-admin"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-600 rounded-xl">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Registered Students</h1>
                            <p className="text-gray-500 mt-1">View and manage all students currently in the system.</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Fetching records...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-2xl text-center shadow-sm">
                        <p className="font-semibold text-xl mb-2">Sync Error</p>
                        <p className="opacity-80">{error.message || "Failed to reach participant service."}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <Users className="w-5 h-5 mr-3 text-blue-600" />
                                Active Student Directory
                            </h3>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-sm font-semibold text-gray-600">
                                    {filteredStudents.length} Students Total
                                </span>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((person, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        key={index}
                                        className="flex items-center space-x-4 p-5 rounded-2xl border border-gray-50 bg-white hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors shadow-inner">
                                            <User className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                {person.fullName || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium truncate flex items-center">
                                                <span className="truncate">{person.email}</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                        <Search className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900">No results found</h4>
                                    <p className="text-gray-500">We couldn't find any students matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupsPage;
