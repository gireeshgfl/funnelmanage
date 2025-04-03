"use client";

import { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';

const ParticipantsList = ({ currentSessionId }) => {
  const [participants, setParticipants] = useState([]);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      const handleInitialParticipants = (participantsList) => {
        const filtered = participantsList.filter(p => p.sessionId === currentSessionId);
        setParticipants(filtered);
      };

      const handleUserJoined = (userDetails) => {
        if (userDetails.role === 'student' && userDetails.sessionId === currentSessionId) {
          setParticipants(prev => {
            if (!prev.find(p => p.userId === userDetails.userId)) {
              return [...prev, userDetails];
            }
            return prev;
          });
        }
      };

      const handleUserLeft = ({ userId, sessionId }) => {
        if (sessionId === currentSessionId) {
          setParticipants(prev => prev.filter(p => p.userId !== userId));
        }
      };

      const handleUpdateEmojis = ({ userId, emojis, sessionId }) => {
        if (sessionId === currentSessionId) {
          setParticipants(prev => prev.map(p => {
            if (p.userId === userId) {
              return { ...p, emojis };
            }
            return p;
          }));
        }
      };

      const handleUpdateStudentPoints = ({ studentId, points, sessionId }) => {
        if (sessionId === currentSessionId) {
          setParticipants(prev => prev.map(p => {
            if (p.userId === studentId) {
              return { ...p, points };
            }
            return p;
          }));
        }
      };

      socket.on('initialParticipants', handleInitialParticipants);
      socket.on('userJoined', handleUserJoined);
      socket.on('userLeft', handleUserLeft);
      socket.on('updateEmojis', handleUpdateEmojis);
      socket.on('updateStudentPoints', handleUpdateStudentPoints);

      return () => {
        socket.off('initialParticipants', handleInitialParticipants);
        socket.off('userJoined', handleUserJoined);
        socket.off('userLeft', handleUserLeft);
        socket.off('updateEmojis', handleUpdateEmojis);
        socket.off('updateStudentPoints', handleUpdateStudentPoints);
      };
    }
  }, [socket, currentSessionId]);

  const handleClearAllEmojis = () => {
    if (socket) {
      socket.emit('clearAllEmojis');
      socket.emit('resetEmojiSelectors');
    }
  };

  const hasEmojis = useMemo(() => {
    return participants.some(participant => participant.emojis && participant.emojis.length > 0);
  }, [participants]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleClearAllEmojis} 
          variant={hasEmojis ? "danger" : "outline"}
          size="small"
        >
          Clear All Reactions
        </Button>
      </div>

      <div className="space-y-3">
        {participants.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No participants yet</p>
        ) : (
          participants.map((participant, index) => (
            <div 
              key={index} 
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium">
                {participant.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                  {participant.username}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Points: {participant.points !== undefined ? participant.points : 0}
                  </span>
                  {participant.emojis && participant.emojis.length > 0 && (
                    <span className="ml-2 text-lg">{participant.emojis.join(' ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;