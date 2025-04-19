import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';

const ChatRoom = ({ sessionId, studentUserName, studentUserId, trainerUserName, isTrainer }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState("Activate");
  const { socket } = useContext(SocketContext);
  const messagesEndRef = useRef(null);

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
        const statusResponse = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_SESSION_STATUS}?id=${sessionId}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.data) setSessionStatus(statusData.data);
        }

        const chatResponse = await fetch(`${API_ROUTES.CHAT_SERVICE.FETCH_CHAT}?id=${sessionId}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
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
      if (updatedData?.status) setSessionStatus(updatedData.status);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      await fetch(API_ROUTES.CHAT_SERVICE.SAVE_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (sessionStatus === "Deactivate") {
    return (
      <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          This session is currently inactive
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait for the trainer to activate the session
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-700/30 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'trainer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'trainer'
              ? 'bg-primary-500 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  {message.username}
                </span>
                <span className="text-xs opacity-80 ml-2">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Button
            onClick={handleSendMessage}
            variant="primary"
            disabled={!inputMessage.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;