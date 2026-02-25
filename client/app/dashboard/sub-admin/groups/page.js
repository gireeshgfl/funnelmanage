"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    User,
    ArrowLeft,
    GraduationCap,
    Plus,
    X,
    Check
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';

const GroupsPage = () => {
    const [data, setData] = useState({ trainers: [], students: [], others: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

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

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;

        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            studentIds: selectedStudents,
            studentCount: selectedStudents.length,
            createdAt: new Date().toLocaleDateString()
        };

        setGroups(prev => [newGroup, ...prev]);
        setIsModalOpen(false);
        setNewGroupName('');
        setSelectedStudents([]);
    };

    const filteredStudentsForModal = data.students.filter(p =>
        (p.fullName?.toLowerCase() || '').includes(modalSearchQuery.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(modalSearchQuery.toLowerCase())
    );

    const filteredStudents = data.students.filter(p =>
        (p.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
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
                                <h1 className="text-3xl font-bold text-gray-900">Student Groups</h1>
                                <p className="text-gray-500 mt-1">Organize students into groups for easier management.</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Group</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Groups List */}
                    <div className="lg:col-span-1 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-blue-600" />
                            Created Groups
                        </h3>
                        {groups.length > 0 ? (
                            <div className="space-y-4">
                                {groups.map((group) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={group.id}
                                        className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900">{group.name}</h4>
                                            <span className="text-xs font-medium text-gray-400">{group.createdAt}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <User className="w-4 h-4 mr-1" />
                                            {group.studentCount} Students
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">No groups created yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Student Directory */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                                All Students
                            </h3>
                            <div className="relative group w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-500 mt-4 font-medium">Loading students...</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((person, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.02 }}
                                                key={index}
                                                className="flex items-center space-x-4 p-4 rounded-xl border border-gray-50 bg-white hover:border-blue-100 transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {person.fullName || 'Anonymous'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {person.email}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center">
                                            <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No students found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Group Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
                                    <p className="text-sm text-gray-500">Enter group name and select members</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Group Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Group Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Batch 2024 - Section A"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all font-medium"
                                    />
                                </div>

                                {/* Student Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-gray-700">Select Students</label>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                            {selectedStudents.length} Selected
                                        </span>
                                    </div>

                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={modalSearchQuery}
                                            onChange={(e) => setModalSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-2">
                                            {filteredStudentsForModal.length > 0 ? (
                                                filteredStudentsForModal.map((student) => (
                                                    <div
                                                        key={student.id || student.email}
                                                        onClick={() => toggleStudentSelection(student.id || student.email)}
                                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedStudents.includes(student.id || student.email)
                                                            ? 'border-blue-600 bg-blue-50/50'
                                                            : 'border-transparent hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
                                                                <p className="text-xs text-gray-500">{student.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedStudents.includes(student.id || student.email)
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'bg-white border-gray-300'
                                                            }`}>
                                                            {selectedStudents.includes(student.id || student.email) && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center py-4 text-gray-500 text-sm">No students found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!newGroupName.trim() || selectedStudents.length === 0}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    Create Group
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default GroupsPage;
