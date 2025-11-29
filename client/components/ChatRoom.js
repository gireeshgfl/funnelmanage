import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

const ChatRoom = ({ sessionId, studentUserName, studentUserId, trainerUserName, isTrainer }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState("Activate");
  const { socket } = useContext(SocketContext);
  // const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (socket && sessionId) {
      console.log('Emitting setSessionId for session:', sessionId);
      socket.emit('setSessionId', { sessionId });
    }
  }, [socket, sessionId]);

  useEffect(() => {
    async function fetchInitialData() {
      if (!sessionId) return;

      try {
        const statusResponse = await apiClient.get(`${API_ROUTES.SESSION_SERVICE.GET_SESSION_STATUS}?id=${sessionId}`);
        if (statusResponse.status === 200 || statusResponse.status === 201) {
          const statusData = statusResponse.data;
          if (statusData.data) setSessionStatus(statusData.data);
        }

        const chatResponse = await apiClient.get(`${API_ROUTES.CHAT_SERVICE.FETCH_CHAT}?id=${sessionId}`);
        if (chatResponse.status === 200 || chatResponse.status === 201) {
          const chatData = chatResponse.data;
          if (chatData.data && Array.isArray(chatData.data)) {
            const formattedMessages = chatData.data.map(msg => ({
              username: msg.sender,
              content: msg.message,
              timestamp: msg.createdAt || new Date().toISOString(),
              type: 'regular',
              role: msg.sender === studentUserName ? 'student' :
                msg.sender === trainerUserName ? 'trainer' : 'other',
            }));
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    }
    fetchInitialData();
  }, [sessionId, studentUserName, trainerUserName]);

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available');
      return;
    }

    console.log('Setting up socket listeners for chat');

    const handleReceiveMessage = (data) => {
      console.log('Received message:', data);
      setMessages(prev => [
        ...prev,
        {
          username: data.sender,
          content: data.message,
          timestamp: new Date().toISOString(),
          type: 'regular',
          role: data.sender === studentUserName ? 'student' :
            data.sender === trainerUserName ? 'trainer' : 'other',
        }
      ]);
    };

    const handleBroadcastMCQs = (mcqArray) => {
      console.log('Received broadcastMCQs:', JSON.stringify(mcqArray, null, 2));
      const mcqMessages = (Array.isArray(mcqArray) ? mcqArray : []).map(mcq => ({
        username: trainerUserName,
        content: `Question: ${mcq.question || mcq.questionText || 'No question text provided'}`,
        timestamp: new Date().toISOString(),
        type: 'mcq',
        mcqData: {
          id: mcq.id || '',
          question: mcq.question || '',
          questionText: mcq.questionText || '',
          questionType: mcq.questionType || 'text',
          answers: Array.isArray(mcq.answers)
            ? mcq.answers.map(answer => typeof answer === 'string' ? { text: answer } : answer)
            : [],
          answerMediaUrls: Array.isArray(mcq.answerMediaUrls) ? mcq.answerMediaUrls : []
        },
        role: 'trainer',
      }));
      setMessages(prev => [...prev, ...mcqMessages]);
    };

    const handleSessionUpdate = (updatedData) => {
      // Only update if the event belongs to this session
      if ((updatedData._id === sessionId || updatedData.sessionId === sessionId) && updatedData?.status) {
        setSessionStatus(updatedData.status);
      }
    };

    socket.on('chatmessage', handleReceiveMessage);
    socket.on('broadcastMCQs', handleBroadcastMCQs);
    socket.on('sessionUpdated', handleSessionUpdate);

    return () => {
      socket.off('chatmessage', handleReceiveMessage);
      socket.off('broadcastMCQs', handleBroadcastMCQs);
      socket.off('sessionUpdated', handleSessionUpdate);
    };
  }, [socket, isTrainer, trainerUserName, studentUserName]);

  // Removed scrollIntoView to prevent whole page scrolling
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  const handleSendMessage = async () => {
    if (!socket || !inputMessage.trim() || !sessionId) return;

    const messageData = {
      sender: isTrainer ? trainerUserName : studentUserName,
      message: inputMessage,
      sessionId,
    };

    setMessages(prev => [
      ...prev,
      {
        username: messageData.sender,
        content: messageData.message,
        timestamp: new Date().toISOString(),
        type: 'regular',
        role: isTrainer ? 'trainer' : 'student',
      },
    ]);

    socket.emit('chatmessage', messageData);
    setInputMessage('');

    try {
      await apiClient.post(API_ROUTES.CHAT_SERVICE.SAVE_CHAT, messageData);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (sessionStatus === "Deactivate") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Session Inactive
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Waiting for trainer to activate...
        </p>
      </div>
    );
  }

  if (sessionStatus === "ENDED") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Session Ended
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This session has been concluded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((message, index) => {
          // Determine if the message is from the current user
          let isMe = false;
          if (isTrainer) {
            isMe = message.role === 'trainer';
          } else {
            isMe = message.role === 'student' &&
              (message.username?.toLowerCase() === studentUserName?.toLowerCase());
          }

          const isTrainerMsg = message.role === 'trainer';

          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${isMe
                ? 'bg-primary-500 text-white rounded-br-none'
                : isTrainerMsg
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 rounded-bl-none'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600 rounded-bl-none'
                }`}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={`text-xs font-bold ${isMe ? 'text-primary-100' : isTrainerMsg ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.username}
                  </span>
                  <span className={`text-[10px] opacity-70 ${isMe ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
        {/* <div ref={messagesEndRef} /> */}
      </div>

      <div className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-all"
          />
          <Button
            onClick={handleSendMessage}
            variant="primary"
            disabled={!inputMessage.trim()}
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all transform active:scale-95"
          >
            <svg className="h-5 w-5 transform rotate-90 translate-x-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;