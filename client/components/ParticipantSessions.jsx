"use client";
import React, { useEffect, useState } from 'react';
import { useParticipantsSessions } from '@/hooks/useParticipantsSessions';
import { useRouter } from 'next/navigation';
import { encryptId } from '@/utils/encryption';

const ParticipantSessions = () => {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const { sessions, fetchSessions } = useParticipantsSessions(setFeedbackMessage);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      await fetchSessions();
      setIsLoading(false);
    };

    loadSessions();
  }, [fetchSessions]);

  const handleSessionClick = (sessionId) => {
    router.push(`https://eduvocate.in/funnel-management/dashboard/student/${encryptId(sessionId)}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Assigned Sessions</h2>

      {feedbackMessage && (
        <div className={`mb-6 p-4 rounded-md ${feedbackMessage.includes('Failed') || feedbackMessage.includes('Error')
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
          }`}>
          {feedbackMessage}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No sessions assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
              onClick={() => handleSessionClick(session._id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-800">{session.sessionName}</h3>
              </div>

              {/* Placeholder for future session details */}
              {session.startTime && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Start Time</p>
                  <p className="font-medium">{session.startTime}</p>
                </div>
              )}

              <div className="mt-2 text-sm text-blue-600">
                Click to view session details →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantSessions;