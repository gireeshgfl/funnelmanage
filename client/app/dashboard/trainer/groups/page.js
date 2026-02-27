'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Loader2, Plus, X, Check } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

export default function GroupsPage() {
    const { groups, loading, error, createGroup, feedbackMessage, participants, participantsLoading, fetchParticipants, reassignGroup } = useGroups();

    // State for create group modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [hoveredGroupId, setHoveredGroupId] = useState(null);

    // Student dropdown state
    const [studentSearch, setStudentSearch] = useState('');

    // Load participants when modal opens
    useEffect(() => {
        if (isCreateModalOpen && (!participants?.students || participants.students.length === 0)) {
            fetchParticipants();
        }
    }, [isCreateModalOpen, participants, fetchParticipants]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        // Validation: At least one student is required as per GroupSaveSchema
        if (selectedStudents.length === 0) {
            alert("At least one student is required to create a group.");
            return;
        }

        setIsSubmitting(true);
        const success = await createGroup({
            name: newGroupName,
            studentIds: selectedStudents,
            status: 'Active'
        });

        setIsSubmitting(false);
        if (success) {
            setIsCreateModalOpen(false);
            setNewGroupName('');
            setSelectedStudents([]);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const filteredStudents = participants?.students?.filter(student =>
        (student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`).toLowerCase().includes(studentSearch.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(studentSearch.toLowerCase()))
    ) || [];

    const getStudentName = (studentId) => {
        const student = participants?.students?.find(s => s._id === studentId || s.id === studentId);
        if (!student) return 'Unknown Student';
        return student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.email || 'Unknown Student';
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary-600" />
                        My Groups
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and view your assigned groups.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white w-full sm:w-auto"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Group</span>
                    </button>
                </div>
            </div>

            {/* Error & Feedback Messages */}
            {feedbackMessage && (
                <div className={`mb-4 px-4 py-3 rounded-lg border ${feedbackMessage.includes('success') || feedbackMessage.toLowerCase().includes('successfully')
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800'
                    }`}>
                    {feedbackMessage}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Group Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Students Count</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading && !isSubmitting ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                                            <p>Loading groups...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-red-500 dark:text-red-400">
                                        <p>Error loading groups: {error.message || error.toString()}</p>
                                    </td>
                                </tr>
                            ) : groups?.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No groups found.
                                    </td>
                                </tr>
                            ) : (
                                groups?.map((group) => {
                                    const groupId = group.id || group._id;
                                    const isSelected = selectedGroupId === groupId;

                                    return (
                                        <tr
                                            key={groupId}
                                            className={`transition-colors ${isSelected
                                                ? 'bg-primary-50/50 dark:bg-primary-900/10'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-l-4 transition-colors ${isSelected ? 'border-primary-600' : 'border-transparent'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    {group.name || group.group_name || 'Unnamed Group'}
                                                    {group.description && (
                                                        <span className="text-xs text-gray-400 hidden lg:inline truncate max-w-[200px]" title={group.description}>
                                                            - {group.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {group.students?.length || group.student_ids?.length || group.studentIds?.length || group.student_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <ReassignButton
                                                    groupId={groupId}
                                                    isSelected={isSelected}
                                                    onSelect={() => {
                                                        setSelectedGroupId(groupId);
                                                        reassignGroup(groupId);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Group Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Group</h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                                <form id="create-group-form" onSubmit={handleCreateGroup} className="space-y-4">
                                    <div>
                                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Group Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="groupName"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                            placeholder="e.g. Summer Bootcamp 2026"
                                            required
                                            autoFocus
                                        />
                                    </div>


                                    {/* Student Selection */}
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between items-center">
                                            <span>Add Students</span>
                                            {selectedStudents.length > 0 && (
                                                <span className="text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full">
                                                    {selectedStudents.length} selected
                                                </span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            {participantsLoading ? (
                                                <div className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                                    <Loader2 className="h-5 w-5 animate-spin text-primary-500 mr-2" />
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading students...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {selectedStudents.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-2 p-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                            {selectedStudents.map(id => (
                                                                <div key={id} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-200">
                                                                    <span className="truncate max-w-[120px]">{getStudentName(id)}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleStudentSelection(id)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col">
                                                        <div className="relative border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search students to add..."
                                                                value={studentSearch}
                                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                                className="w-full pl-9 pr-4 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"
                                                            />
                                                        </div>

                                                        <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                                                            {filteredStudents.length === 0 ? (
                                                                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                    No students found.
                                                                </div>
                                                            ) : (
                                                                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                                                    {filteredStudents.map(student => {
                                                                        const studentId = student._id || student.id;
                                                                        const isSelected = selectedStudents.includes(studentId);

                                                                        return (
                                                                            <li key={studentId}>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleStudentSelection(studentId)}
                                                                                    className={`w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex flex-col overflow-hidden mr-2">
                                                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                                            {student.fullName || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown'}
                                                                                        </span>
                                                                                        {student.email && (
                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                                                {student.email}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className={`shrink-0 h-5 w-5 rounded border flex items-center justify-center ${isSelected
                                                                                        ? 'bg-primary-600 border-primary-600 text-white'
                                                                                        : 'border-gray-300 dark:border-gray-600'
                                                                                        }`}>
                                                                                        {isSelected && <Check className="h-3 w-3" />}
                                                                                    </div>
                                                                                </button>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-end gap-3 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-group-form"
                                    disabled={isSubmitting || !newGroupName.trim() || participantsLoading}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-500/20"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                                    ) : (
                                        'Create Group'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

// --- Helper Components ---

function ReassignButton({ groupId, isSelected, onSelect }) {
    const buttonRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.left
            });
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                className={`transition-colors font-medium ${isSelected
                    ? 'text-primary-700 dark:text-primary-400 underline underline-offset-4'
                    : 'text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300'
                    }`}
                onClick={onSelect}
                onMouseEnter={() => {
                    updatePosition();
                    setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
            >
                Reassign
            </button>
            {isHovered && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-2xl pointer-events-none whitespace-normal break-words leading-relaxed w-52 text-center animate-in fade-in slide-in-from-right-1 duration-75"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left - 12}px`,
                        transform: 'translate(-100%, -50%)'
                    }}
                >
                    activate when you are ready to re assign this group to another trainer
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
            )}
        </>
    );
}
