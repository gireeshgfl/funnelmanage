'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Archive, RefreshCw, Plus, Edit2, Trash2, Power, ArrowRight } from 'lucide-react';
import SessionFormModal from '@/components/session_management/SessionFormModal';
import SessionList from '@/components/session_management/SessionList'; // Import the SessionList component
import { 
  getSessions, 
  createSession, 
  updateSession, 
  deleteSession, 
  archiveSession, 
  unarchiveSession, 
  activateSession 
} from '@/hooks/session_management/sessionService';
import { useFunnel } from '@/hooks/useFunnel';
import { getTopics } from '@/hooks/session_management/topicService';
import { getParticipants } from '@/hooks/session_management/participantService';

const SessionManagementPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [participants, setParticipants] = useState([]);
  const { fetchFunnellingData } = useFunnel();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('active');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch sessions, topics, and participants concurrently
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsData, topicsData, participantsData] = await Promise.all([
        getSessions(),
        getTopics(),
        getParticipants()
      ]);
      setSessions(sessionsData);
      setTopics(topicsData);
      setParticipants(participantsData);
      setError('');
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (sessionData) => {
    try {
      await createSession(sessionData);
      await fetchData();
      setOpenModal(false);
    } catch (err) {
      setError('Failed to create session');
    }
  };

  const handleUpdate = async (sessionData) => {
    try {
      await updateSession({ ...sessionData, _id: currentSession._id });
      await fetchData();
      setOpenModal(false);
      setEditMode(false);
    } catch (err) {
      setError('Failed to update session');
    }
  };

  const handleDelete = async (sessionId) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession(sessionId);
        await fetchData();
      } catch (err) {
        setError('Failed to delete session');
      }
    }
  };

  const handleArchive = async (sessionId) => {
    try {
      await archiveSession(sessionId);
      await fetchData();
    } catch (err) {
      setError('Failed to archive session');
    }
  };

  const handleUnarchive = async (sessionId) => {
    try {
      await unarchiveSession(sessionId);
      await fetchData();
    } catch (err) {
      setError('Failed to unarchive session');
    }
  };

  const handleActivate = async (sessionId) => {
    const session = sessions.find(s => s._id === sessionId);
    const newStatus = session.status === 'Activate' ? 'Deactivate' : 'Activate';
    try {
      await activateSession(sessionId, newStatus);
      await fetchData();
    } catch (err) {
      setError('Failed to update session status');
    }
  };

  const handleJoinSession = (sessionId) => {
    router.push(`/dashboard/trainer/sessions/${sessionId}`);
  };

  // Filter sessions based on the selected filter type
  const filteredSessions = sessions.filter(session => {
    if (filterType === 'archived') return session.archived === 'True';
    return session.archived !== 'True';
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
          {filterType !== 'active' && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Archived sessions
            </p>
          )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditMode(false);
              setCurrentSession(null);
              setOpenModal(true);
            }}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Session</span>
          </button>
          
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-2 text-sm font-medium ${filterType === 'active' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Sessions</span>
              </div>
            </button>
            <button
              onClick={() => setFilterType('archived')}
              className={`px-4 py-2 text-sm font-medium ${filterType === 'archived' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <div className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <span>Archived</span>
              </div>
            </button>
          </div>
          
          <button
            onClick={fetchData}
            className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Sessions List using the SessionList component */}
      <SessionList
        sessions={filteredSessions}
        filterType={filterType}
        onEdit={(session) => {
          setEditMode(true);
          setCurrentSession(session);
          setOpenModal(true);
        }}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onJoin={handleJoinSession}
        onActivate={handleActivate}
      />

      {/* Session Form Modal */}
      <SessionFormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditMode(false);
          setCurrentSession(null);
        }}
        onSubmit={editMode ? handleUpdate : handleCreate}
        initialData={currentSession}
        availableTopics={topics}
        availableParticipants={participants}
        fetchFunnellingData={fetchFunnellingData}
      />
    </div>
  );
};

export default SessionManagementPage;
