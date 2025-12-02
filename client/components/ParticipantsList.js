"use client";

import { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { Users } from 'lucide-react';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';

const ParticipantsList = ({ currentSessionId, isTrainer = false, participants: externalParticipants }) => {
  const [internalParticipants, setInternalParticipants] = useState([]);
  console.log(internalParticipants, "👥 Participants List");

  // Use external participants if provided, otherwise use internal state
  const participants = externalParticipants || internalParticipants;

  const { socket } = useContext(SocketContext);

  useEffect(() => {
    // If external participants are provided, we don't need internal socket listeners for data
    if (externalParticipants || !socket) return;

    console.log("🧠 ParticipantsList: Binding internal socket listeners...");

    const handleInitialParticipants = (participantsList) => {
      console.log("🚀 initialParticipants", participantsList);
      setInternalParticipants(participantsList.filter(p => String(p.sessionId) === String(currentSessionId)));
    };

    const handleUserJoined = async (userDetails) => {
      // Allow both students and trainers to be added to the list
      console.log("👤 userJoined event received:", userDetails);

      if (String(userDetails.sessionId) === String(currentSessionId)) {
        console.log("✅ Session ID matches, adding to list:", userDetails.username);

        setInternalParticipants(prev => {
          const alreadyExists = prev.some(p => p.userId === userDetails.userId);
          if (alreadyExists) {
            console.log("⚠️ User already exists in list:", userDetails.username);
            return prev;
          }
          return [...prev, userDetails];
        });
      } else {
        console.log("❌ Session ID mismatch. Current:", currentSessionId, "Received:", userDetails.sessionId);
      }
    };

    const handleUserLeft = ({ userId, sessionId }) => {
      console.log("❌ userLeft triggered", userId, sessionId);
      if (String(sessionId) === String(currentSessionId)) {
        setInternalParticipants(prev => prev.filter(p => p.userId !== userId));
      }
    };

    const handleUpdateEmojis = ({ userId, emojis, sessionId }) => {
      console.log("🔄 Handling emoji update for", userId, "with emojis:", emojis);
      if (String(sessionId) === String(currentSessionId)) {
        setInternalParticipants(prev =>
          prev.map(p =>
            p.userId === userId
              ? { ...p, emojis: Array.isArray(emojis) ? emojis : [emojis] }
              : p
          )
        );
      }
    };

    const handleUpdateStudentPoints = ({ studentId, points, sessionId }) => {
      if (String(sessionId) === String(currentSessionId)) {
        setInternalParticipants(prev =>
          prev.map(p =>
            p.userId === studentId ? { ...p, points } : p
          )
        );
      }
    };

    // Listen for clearAllEmojis event from server (triggered by trainer)
    const handleClearAll = (payload) => {
      console.log("🧹 ParticipantsList: Received clearAllEmojis event", payload);
      setInternalParticipants(prev =>
        prev.map(p => ({ ...p, emojis: [] }))
      );
    };

    socket.on('initialParticipants', handleInitialParticipants);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('updateEmojis', handleUpdateEmojis);
    socket.on('updateStudentPoints', handleUpdateStudentPoints);
    socket.on('clearAllEmojis', handleClearAll);

    return () => {
      socket.off('initialParticipants', handleInitialParticipants);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('updateEmojis', handleUpdateEmojis);
      socket.off('updateStudentPoints', handleUpdateStudentPoints);
      socket.off('clearAllEmojis', handleClearAll);
    };
  }, [socket, currentSessionId, externalParticipants]);

  const handleClearAllEmojis = () => {
    console.log("🧹 handleClearAllEmojis called");
    if (socket) {
      // Optimistic UI update for internal state (if used)
      if (!externalParticipants) {
        setInternalParticipants(prev =>
          prev.map(p => ({ ...p, emojis: [] }))
        );
      }

      console.log("👥 Clearing emojis for", participants.length, "participants");
      // Workaround: Emit update for each user since clearAllEmojis broadcast is missing
      participants.forEach(p => {
        if (p.emojis && p.emojis.length > 0) {
          console.log("📤 Emitting clear for user:", p.userId, p.username);
          socket.emit('updateEmojis', {
            emojis: [],
            sessionId: currentSessionId,
            userId: p.userId
          });
        }
      });

      socket.emit('clearAllEmojis');
    }
  };

  const hasEmojis = useMemo(() =>
    participants.some(p => p.emojis?.length > 0),
    [participants]
  );

  const getEmojiIcon = (emoji) => {
    switch (emoji) {
      case '👍': return '👍';
      case '👎': return '👎';
      case '❓': return '❓';
      case '🙋': return '🙋';
      case '💡': return '💡';
      case '🎉': return '🎉';
      default: return emoji;
    }
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'trainer' && b.role !== 'trainer') return -1;
    if (a.role !== 'trainer' && b.role === 'trainer') return 1;
    return 0;
  });

  return (
    <div className="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Participants ({participants.length})
        </h3>
        {isTrainer && (
          <Button
            onClick={handleClearAllEmojis}
            variant={hasEmojis ? "danger" : "outline"}
            size="sm"
            disabled={!hasEmojis}
          >
            Clear Reactions
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
            <Users className="h-8 w-8 mb-2" />
            <p>No participants yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedParticipants.map((participant) => (
              <li
                key={participant.userId}
                className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-medium ${participant.role === 'trainer'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}>
                    {participant.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-200 truncate flex items-center gap-2">
                      {participant.username}
                      {participant.role === 'trainer' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                          Trainer
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {participant.role !== 'trainer' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          {participant.points || 0} pts
                        </span>
                      )}

                      {participant.emojis?.length > 0 && (
                        <div className="flex items-center gap-1">
                          {participant.emojis.map((emoji, i) => (
                            <span key={i} className="text-lg">
                              {getEmojiIcon(emoji)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;
