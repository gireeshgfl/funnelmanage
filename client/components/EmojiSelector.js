import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '@/context/socketContext';
import { AuthContext } from '@/context/AuthContext';
import { Button } from '@components/ui/components';

// 1️⃣ Emoji List
const emojis = [
  { emoji: '👍', label: 'Thumbs Up', color: 'green' },
  { emoji: '👎', label: 'Thumbs Down', color: 'red' },
  { emoji: '❓', label: 'Question', color: 'yellow' },
  { emoji: '🙋', label: 'Raise Hand', color: 'blue' },
  { emoji: '💡', label: 'Idea', color: 'purple' },
  { emoji: '🎉', label: 'Celebrate', color: 'pink' },
];

// 2️⃣ Color Class Mapping
const colorClassMap = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

const EmojiSelector = () => {
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const currentUserId = user?.user_id;

  // 3️⃣ Listen to socket events
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleUpdateEmojis = ({ userId, emojis }) => {
      if (currentUserId === userId) {
        setSelectedEmoji(emojis[0] || null);
      }
    };

    const handleClearAllEmojis = () => setSelectedEmoji(null);
    const handleResetEmojiSelectors = () => setSelectedEmoji(null);

    const handleInitialParticipants = (participantsList) => {
      const currentUser = participantsList.find(p => p.userId === currentUserId);
      if (currentUser) {
        setSelectedEmoji(currentUser.emojis[0] || null);
      }
    };

    socket.on('updateEmojis', handleUpdateEmojis);
    socket.on('clearAllEmojis', handleClearAllEmojis);
    socket.on('resetEmojiSelectors', handleResetEmojiSelectors);
    socket.on('initialParticipants', handleInitialParticipants);

    return () => {
      socket.off('updateEmojis', handleUpdateEmojis);
      socket.off('clearAllEmojis', handleClearAllEmojis);
      socket.off('resetEmojiSelectors', handleResetEmojiSelectors);
      socket.off('initialParticipants', handleInitialParticipants);
    };
  }, [socket, currentUserId]);

  // 4️⃣ Toggle selected emoji
  const toggleEmoji = (emoji) => {
    const newEmoji = selectedEmoji === emoji ? null : emoji;
    setSelectedEmoji(newEmoji);
  
    if (socket) {
      socket.emit('updateEmojis', { 
        emojis: newEmoji ? [newEmoji] : [],
        sessionId: window.location.pathname.split('/').pop(),
        userId: currentUserId 
      });
    }
  };

  // 5️⃣ UI
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {emojis.map(({ emoji, label, color }) => {
        const isSelected = selectedEmoji === emoji;
        const activeClasses = `${colorClassMap[color]} text-white shadow-lg scale-110`;
        const inactiveClasses =
          'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';

        return (
          <button
            key={emoji}
            onClick={() => toggleEmoji(emoji)}
            aria-label={label}
            className={`
              relative p-2 text-2xl rounded-full transition-all duration-200
              hover:scale-110 hover:shadow-md
              ${isSelected ? activeClasses : inactiveClasses}
              group
            `}
          >
            {emoji}
            <span
              className={`
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                text-xs font-medium text-white bg-gray-800 dark:bg-gray-900 rounded
                opacity-0 group-hover:opacity-100 transition-opacity
                whitespace-nowrap pointer-events-none
              `}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default EmojiSelector;
