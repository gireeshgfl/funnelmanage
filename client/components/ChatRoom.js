import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';

const ChatRoom = ({ sessionId, studentUserName, studentUserId, trainerUserName, isTrainer, onCorrectAnswer }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState("Activate");
  const { socket } = useContext(SocketContext);
  const messagesEndRef = useRef(null);

  // Socket connection and session setup
  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("setSessionId", { sessionId });
    }
  }, [socket, sessionId]);

  // Fetch session status
  useEffect(() => {
    async function fetchSessionStatus() {
      if (!sessionId) return;
      try {
        const response = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_SESSION_STATUS}?id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) setSessionStatus(data.data);
        }
      } catch (error) {
        console.error("Error fetching session status:", error);
      }
    }
    fetchSessionStatus();
  }, [sessionId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
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
      const mcqMessages = mcqArray.map(mcq => ({
        username: trainerUserName,
        content: `Question: ${mcq.question}`,
        timestamp: new Date().toISOString(),
        type: 'mcq',
        mcqData: { 
          id: mcq.id || '', 
          question: mcq.question, 
          questionText: mcq.questionText, 
          questionType: mcq.questionType, 
          answers: mcq.answers, 
          answerMediaUrls: mcq.answerMediaUrls || [] 
        },
        role: 'trainer',
      }));
      setMessages(prev => [...prev, ...mcqMessages]);
    };

    const handlePushQuestion = (questionData) => {
      setMessages(prev => [
        ...prev,
        {
          username: trainerUserName,
          content: `Question: ${questionData.question}`,
          timestamp: new Date().toISOString(),
          type: 'mcq',
          mcqData: questionData,
          role: 'trainer',
        }
      ]);
    };

    const handleSessionUpdate = (updatedData) => {
      if (updatedData?.status) setSessionStatus(updatedData.status);
    };

    socket.on('recievemessage', handleReceiveMessage);
    socket.on('broadcastMCQs', handleBroadcastMCQs);
    socket.on('pushQuestion', handlePushQuestion);
    socket.on('sessionUpdated', handleSessionUpdate);

    return () => {
      socket.off('recievemessage', handleReceiveMessage);
      socket.off('broadcastMCQs', handleBroadcastMCQs);
      socket.off('pushQuestion', handlePushQuestion);
      socket.off('sessionUpdated', handleSessionUpdate);
    };
  }, [socket, isTrainer, trainerUserName, studentUserName, studentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!socket || !inputMessage.trim()) return;

    const messageData = {
      sender: isTrainer ? trainerUserName : studentUserName,
      message: inputMessage,
      sessionId,
    };

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

  const handleSelectAnswer = (messageIndex, answerIndex) => {
    setMessages(prev => prev.map((msg, idx) =>
      idx === messageIndex ? { ...msg, selectedAnswer: answerIndex } : msg
    ));
  };

  const handleSubmitMCQ = async (messageIndex) => {
    const message = messages[messageIndex];
    if (message.selectedAnswer === undefined) return;

    const { id, question, answers } = message.mcqData;
    const selectedAnswer = answers[message.selectedAnswer].text;

    try {
      const response = await fetch(API_ROUTES.SESSION_SERVICE.SAVE_POINTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: id,
          selectedAnswerIndex: message.selectedAnswer,
          selectedAnswerText: selectedAnswer,
          studentUserName,
          studentUserId,
          questionText: question,
          sessionId,
        }),
      });

      if (response.ok && onCorrectAnswer) {
        const result = await response.json();
        if (result.message === "Correct Answer. Points saved successfully") {
          onCorrectAnswer(true);
        }
      }
    } catch (error) {
      console.error('Error submitting MCQ:', error);
    }
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Messages container */}
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

              {message.type === 'mcq' ? (
                <div className="mt-2">
                  {/* MCQ Question */}
                  <div className="mb-3">
                    {message.mcqData.questionType === 'video-text' ? (
                      <video controls className="w-full max-h-48 rounded-lg mb-2">
                        <source src={message.mcqData.question} type="video/mp4" />
                      </video>
                    ) : message.mcqData.questionType === 'image-text' ? (
                      <img 
                        src={message.mcqData.question} 
                        alt="Question" 
                        className="w-full max-h-48 rounded-lg mb-2 object-cover"
                      />
                    ) : null}
                    <p className="font-medium">{message.mcqData.questionText || message.content}</p>
                  </div>

                  {/* MCQ Answers */}
                  {message.mcqData.questionType === 'image-image' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {message.mcqData.answerMediaUrls?.map((url, answerIndex) => (
                        <label 
                          key={answerIndex}
                          className={`relative cursor-pointer ${!isTrainer ? 'hover:opacity-90' : 'cursor-default'}`}
                        >
                          <input
                            type="radio"
                            name={`mcq-${index}`}
                            checked={message.selectedAnswer === answerIndex}
                            onChange={() => handleSelectAnswer(index, answerIndex)}
                            disabled={isTrainer}
                            className="absolute opacity-0 w-0 h-0"
                          />
                          <div className={`border-2 rounded-lg overflow-hidden transition-all ${
                            message.selectedAnswer === answerIndex 
                              ? 'border-primary-500 dark:border-primary-400' 
                              : 'border-transparent'
                          }`}>
                            <img
                              src={url}
                              alt={`Option ${answerIndex + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            {message.mcqData.answers?.[answerIndex]?.text && (
                              <div className="p-2 text-center text-sm bg-white dark:bg-gray-700">
                                {message.mcqData.answers[answerIndex].text}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {message.mcqData.answers?.map((answer, answerIndex) => (
                        <li key={answerIndex}>
                          <label className={`flex items-center p-2 rounded-lg cursor-pointer ${
                            !isTrainer ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                          } ${
                            message.selectedAnswer === answerIndex
                              ? 'bg-primary-100 dark:bg-primary-900/30'
                              : 'bg-white dark:bg-gray-700'
                          }`}>
                            <input
                              type="radio"
                              name={`mcq-${index}`}
                              checked={message.selectedAnswer === answerIndex}
                              onChange={() => handleSelectAnswer(index, answerIndex)}
                              disabled={isTrainer}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                            />
                            <span className="ml-3">{answer.text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isTrainer && (
                    <Button
                      onClick={() => handleSubmitMCQ(index)}
                      variant="primary"
                      size="sm"
                      className="mt-3 w-full"
                    >
                      Submit Answer
                    </Button>
                  )}
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
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