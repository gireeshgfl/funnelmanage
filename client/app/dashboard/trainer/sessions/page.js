'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Archive, RefreshCw, Plus, Edit2, Trash2, Power, ArrowRight } from 'lucide-react';
import SessionFormModal from '@/components/session_management/SessionFormModal';
import { getSessions, createSession, updateSession, deleteSession, archiveSession, unarchiveSession, activateSession } from '@/hooks/session_management/sessionService';
import { getTopics } from '@/hooks/session_management/topicService';
import { getParticipants } from '@/hooks/session_management/participantService';

const SessionManagementPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('active');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredSessions = sessions.filter(session => {
    if (filterType === 'archived') return session.archived === 'True';
    return session.archived !== 'True';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filterType === 'active' ? 'Active training sessions' : 'Archived sessions'}
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
                <span>Active</span>
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

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No sessions found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {filterType === 'active' 
                ? 'Get started by creating a new training session'
                : 'No archived sessions available'}
            </p>
            {filterType === 'active' && (
              <button
                onClick={() => {
                  setEditMode(false);
                  setCurrentSession(null);
                  setOpenModal(true);
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Session
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSessions.map((session) => (
              <div key={session._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {session.name || 'Untitled Session'}
                      </h3>
                      {session.status === 'Activate' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {session.description || 'No description provided'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {session.topics?.slice(0, 3).map(topic => (
                        <span key={topic} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
                          {topic}
                        </span>
                      ))}
                      {session.topics?.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          +{session.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      onClick={() => handleJoinSession(session._id)}
                      className="flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <ArrowRight className="-ml-1 mr-2 h-4 w-4" />
                      Join
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditMode(true);
                          setCurrentSession(session);
                          setOpenModal(true);
                        }}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      
                      {filterType === 'active' ? (
                        <button
                          onClick={() => handleArchive(session._id)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Archive"
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(session._id)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Unarchive"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleActivate(session._id)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title={session.status === 'Activate' ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(session._id)}
                        className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
      />
    </div>
  );
};

export default SessionManagementPage;