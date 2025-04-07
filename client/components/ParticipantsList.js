"use client";

import { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { Users, Smile, Frown, Meh, ThumbsUp, ThumbsDown } from 'lucide-react';

const ParticipantsList = ({ currentSessionId }) => {
  const [participants, setParticipants] = useState([]);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (!socket) return;

    const handleInitialParticipants = (participantsList) => {
      setParticipants(participantsList.filter(p => p.sessionId === currentSessionId));
    };

    const handleUserJoined = (userDetails) => {
      if (userDetails.role === 'student' && userDetails.sessionId === currentSessionId) {
        setParticipants(prev => [...prev.filter(p => p.userId !== userDetails.userId), userDetails]);
      }
    };

    const handleUserLeft = ({ userId, sessionId }) => {
      if (sessionId === currentSessionId) {
        setParticipants(prev => prev.filter(p => p.userId !== userId));
      }
    };

    const handleUpdateEmojis = ({ userId, emojis, sessionId }) => {
      if (sessionId === currentSessionId) {
        setParticipants(prev => prev.map(p => 
          p.userId === userId ? { ...p, emojis } : p
        ));
      }
    };

    const handleUpdateStudentPoints = ({ studentId, points, sessionId }) => {
      if (sessionId === currentSessionId) {
        setParticipants(prev => prev.map(p => 
          p.userId === studentId ? { ...p, points } : p
        ));
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
  }, [socket, currentSessionId]);

  const handleClearAllEmojis = () => {
    if (socket) {
      socket.emit('clearAllEmojis');
      socket.emit('resetEmojiSelectors');
    }
  };

  const hasEmojis = useMemo(() => 
    participants.some(p => p.emojis?.length > 0),
    [participants]
  );

  const getEmojiIcon = (emoji) => {
    switch(emoji) {
      case '😊': return <Smile className="h-4 w-4" />;
      case '😢': return <Frown className="h-4 w-4" />;
      case '👍': return <ThumbsUp className="h-4 w-4" />;
      case '👎': return <ThumbsDown className="h-4 w-4" />;
      case '😐': return <Meh className="h-4 w-4" />;
      default: return emoji;
    }
  };

  return (
    <div className="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Participants ({participants.length})
        </h3>
        <Button 
          onClick={handleClearAllEmojis} 
          variant={hasEmojis ? "danger" : "outline"}
          size="sm"
          disabled={!hasEmojis}
        >
          Clear Reactions
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
            <Users className="h-8 w-8 mb-2" />
            <p>No participants yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {participants.map((participant) => (
              <li 
                key={participant.userId}
                className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-200 truncate">
                      {participant.username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        {participant.points || 0} pts
                      </span>
                      
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