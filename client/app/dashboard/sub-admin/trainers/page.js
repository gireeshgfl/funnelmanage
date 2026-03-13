"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    ArrowLeft,
    ShieldCheck,
    Mail,
    X,
    Check,
    User,
    LayoutGrid,
    AlertCircle,
    CheckCircle2,
    Info
} from 'lucide-react';
import Link from 'next/link';

import { useGroups } from '@/hooks/useGroups';

const TrainersPage = () => {
    const {
        groups,
        loading: groupsLoading,
        error: groupsError,
        participants,
        participantsLoading,
        participantsError,
        assignTrainer,
        feedbackMessage,
        setFeedbackMessage
    } = useGroups();

    // Auto-clear feedback message
    React.useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => {
                setFeedbackMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage, setFeedbackMessage]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    // Map real data to assignments
    const assignments = groups.map(group => {
        // Find assigned trainer for this group
        // Assuming group has a trainerId or trainer has this group's id/name
        const assignedTrainer = participants.trainers?.find(t =>
            t.assignedGroups?.includes(group.name) || t._id === group.trainerId
        );

        return {
            id: group._id,
            groupName: group.name,
            trainerName: assignedTrainer ? (assignedTrainer.fullName || assignedTrainer.username) : null,
            email: assignedTrainer?.email || 'N/A',
            specialization: assignedTrainer?.specialization || 'N/A',
            status: assignedTrainer ? 'Assigned' : 'Unassigned',
            experience: assignedTrainer?.experience || 'N/A',
            isOwnGroup: group.is_own_group,
            reassign: group.reassign
        };
    });

    const filteredAssignments = assignments.filter(assignment =>
        assignment.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.trainerName && assignment.trainerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isLoading = groupsLoading || participantsLoading;
    const error = groupsError || participantsError;

    return (
        <div className="min-h-screen bg-transparent p-8">
            {/* Floating Alert */}
            <AnimatePresence>
                {feedbackMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-8 left-1/2 z-[100] w-full max-w-md px-4"
                    >
                        <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center space-x-4 ${feedbackMessage.toLowerCase().includes('success')
                            ? 'bg-emerald-500/90 border-emerald-400 text-white'
                            : 'bg-red-500/90 border-red-400 text-white'
                            }`}>
                            <div className="flex-shrink-0">
                                {feedbackMessage.toLowerCase().includes('success') ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : feedbackMessage.toLowerCase().includes('wait') || feedbackMessage.toLowerCase().includes('process') ? (
                                    <Info className="w-6 h-6" />
                                ) : (
                                    <AlertCircle className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1 font-bold text-sm">
                                {feedbackMessage}
                            </div>
                            <button
                                onClick={() => setFeedbackMessage("")}
                                className="flex-shrink-0 hover:bg-white/20 p-1 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trainer Assignment</h1>
                                <p className="text-gray-500 mt-1">Manage pairings between trainers and student groups.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="relative group w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by trainer, group or specialization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">{filteredAssignments.length} Assignments found</span>
                    </div>
                </div>

                {/* Assignments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Fetching Assignment Data...</p>
                        </div>
                    ) : error ? (
                        <div className="col-span-full py-24 text-center bg-red-50 rounded-[40px] border border-red-100 shadow-sm">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
                            <p className="text-red-500 max-w-sm mx-auto font-medium">{error.message || "We couldn't reach the trainer service."}</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map((assignment, index) => (
                                    <motion.div
                                        key={assignment.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`rounded-3xl border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden p-2 ${assignment.status === 'Assigned'
                                            ? 'bg-white border-gray-100'
                                            : 'bg-white border-amber-200 shadow-amber-500/5'
                                            } group`}
                                    >
                                        <div className={`p-8 rounded-[24px] border flex flex-col h-full relative overflow-hidden ${assignment.reassign
                                            ? 'bg-gradient-to-br from-red-50 to-white border-red-200 shadow-red-500/10'
                                            : assignment.status === 'Assigned' || !assignment.isOwnGroup
                                                ? 'bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 border-blue-50/50'
                                                : 'bg-gradient-to-br from-amber-50/40 via-white to-orange-50/40 border-amber-100/50'
                                            }`}>
                                            <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
                                                {assignment.isOwnGroup && (
                                                    <div className="flex items-center space-x-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">
                                                        <ShieldCheck className="w-2.5 h-2.5" />
                                                        <span>Your Group</span>
                                                    </div>
                                                )}
                                                {assignment.reassign && (
                                                    <div className="flex items-center space-x-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-500/30 animate-pulse">
                                                        <Users className="w-2.5 h-2.5" />
                                                        <span>Reassignment Requested</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-blue-600/10 transition-colors" />

                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Group Name</p>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">
                                                        {assignment.groupName}
                                                    </h3>
                                                </div>
                                                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-blue-100 flex items-center justify-center shadow-md">
                                                    <Users className="w-7 h-7 text-blue-600" />
                                                </div>
                                            </div>

                                            <div className="mb-8 relative z-10">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assigned Trainer</p>
                                                </div>
                                                {assignment.trainerName ? (
                                                    <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm group-hover:border-blue-200 transition-colors">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30">
                                                            {assignment.trainerName.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-black text-gray-900 truncate text-lg">{assignment.trainerName}</p>
                                                        </div>
                                                    </div>
                                                ) : !assignment.isOwnGroup ? (
                                                    <div className="flex items-center space-x-4 bg-gray-50/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 font-black text-lg">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-500 text-sm italic">Created by Trainer</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center p-6 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Trainer Assigned</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto relative z-10">
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Contact Details</p>
                                                    <div className="flex items-center text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 max-w-sm">
                                                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                        <span className="truncate">{assignment.email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-gray-100/80 flex items-center justify-between relative z-10">
                                                <div className="flex items-center">
                                                    {assignment.reassign ? (
                                                        <div className="flex items-center space-x-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 shadow-sm shadow-red-500/10">
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-700">Reassign Needed</span>
                                                        </div>
                                                    ) : !assignment.isOwnGroup ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Trainer Present</span>
                                                        </div>
                                                    ) : assignment.status === 'Assigned' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Assigned</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm shadow-amber-500/10">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">Needs Attention</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedGroup(assignment);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center group/btn ${assignment.status === 'Assigned' || !assignment.isOwnGroup
                                                        ? 'bg-gray-900 text-white hover:bg-blue-600'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                                                        }`}>
                                                    {assignment.status === 'Assigned' || !assignment.isOwnGroup ? 'Reassign Trainer' : 'Assign Trainer'}
                                                    <ArrowLeft className="w-3 h-3 ml-2 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200 shadow-inner">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">No active assignments found</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">We couldn't find any pairings matching your search. Try adjusting your filters.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Trainer Selection Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Assign Trainer</h3>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Select a trainer for {selectedGroup?.groupName}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setModalSearchQuery('');
                                    }}
                                    className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-md group"
                                >
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search trainers by name or email..."
                                        value={modalSearchQuery}
                                        onChange={(e) => setModalSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {participants.trainers
                                        ?.filter(t =>
                                            t.fullName?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                                            t.email?.toLowerCase().includes(modalSearchQuery.toLowerCase())
                                        ).map((trainer) => (
                                            <button
                                                key={trainer._id}
                                                onClick={async () => {
                                                    const success = await assignTrainer(selectedGroup.id, trainer._id);
                                                    if (success) setIsModalOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg">
                                                        {trainer.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-black text-gray-900 leading-none mb-1">{trainer.fullName || 'Unnamed Trainer'}</p>
                                                        <p className="text-xs font-bold text-gray-500">{trainer.email}</p>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                            </button>
                                        ))}
                                    {participants.trainers?.filter(t =>
                                        t.fullName?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                                        t.email?.toLowerCase().includes(modalSearchQuery.toLowerCase())
                                    ).length === 0 && (
                                            <div className="py-12 text-center text-gray-400 font-bold italic">
                                                No trainers found matching "{modalSearchQuery}"
                                            </div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrainersPage;
