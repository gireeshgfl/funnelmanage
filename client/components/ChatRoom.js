import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from '@components/ui/components';
import { SocketContext } from '@/context/socketContext';
import { API_ROUTES } from '@/config';

const ChatRoom = ({ sessionId, studentUserName, studentUserId, trainerUserName, isTrainer, onCorrectAnswer }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionStatus, setSessionStatus] = useState("Activate");
  const { socket } = useContext(SocketContext);
  const messageContainerRef = useRef(null);

  // Emit the session id once the socket is connected
  useEffect(() => {
    if (socket && sessionId) {
      console.log("Emitting setSessionId with:", sessionId);
      socket.emit("setSessionId", { sessionId });
    }
  }, [socket, sessionId]);

  useEffect(() => {
    async function fetchSessionStatus() {
      if (!sessionId) return;
      try {
        const response = await fetch(`${API_ROUTES.SESSION_SERVICE.GET_SESSION_STATUS}?id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setSessionStatus(data.data);
          }
        } else {
          console.error("Error fetching session status:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching session status:", error);
      }
    }
    fetchSessionStatus();
  }, [sessionId]);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('recievemessage', (data) => {
        const { sender, message } = data;
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            username: sender,
            content: message,
            timestamp: new Date().toISOString(),
            type: 'regular',
            role: sender === studentUserName ? 'student' : sender === trainerUserName ? 'trainer' : 'other',
          },
        ]);
      });

      socket.on('broadcastMCQs', (mcqArray) => {
        mcqArray.forEach((mcq) => console.log('Received MCQ:', mcq));
        const mcqMessages = mcqArray.map((mcq) => {
          const { question = '', questionText = '', questionType = 'text-text', answers = [], answerMediaUrls = [] } = mcq;
          return {
            username: trainerUserName,
            content: `Question: ${question}`,
            timestamp: new Date().toISOString(),
            type: 'mcq',
            mcqData: { id: mcq.id || '', question, questionText, questionType, answers, answerMediaUrls },
            role: 'trainer',
          };
        });
        setMessages((prevMessages) => [...prevMessages, ...mcqMessages]);
      });

      socket.on('pushQuestion', (questionData) => {
        const { id, question, questionText, questionType, answers } = questionData;
        const transformedAnswers = Array.isArray(answers)
          ? answers.map((answer) => ({ text: answer }))
          : [];
        const questionMessage = {
          username: trainerUserName,
          content: `Question: ${question}`,
          timestamp: new Date().toISOString(),
          type: 'mcq',
          mcqData: { id, question, questionText, questionType, answers: transformedAnswers, answerMediaUrls: questionData.answerMediaUrls || [] },
          role: 'trainer',
        };
        setMessages((prevMessages) => [...prevMessages, questionMessage]);
      });

      socket.on('sessionUpdated', (updatedData) => {
        console.log('Received session update:', updatedData);
        if (updatedData && updatedData.status) {
          setSessionStatus(updatedData.status);
        }
      });

      return () => {
        console.log('Cleaning up socket listeners');
        socket.off('recievemessage');
        socket.off('broadcastMCQs');
        socket.off('pushQuestion');
        socket.off('sessionUpdated');
      };
    }
  }, [socket, isTrainer, trainerUserName, studentUserName, studentUserId]);

  const handleSendMessage = async () => {
    if (!socket) {
      console.warn('Socket is not connected yet.');
      return;
    }
    if (inputMessage.trim() !== '') {
      const messageData = {
        sender: isTrainer ? trainerUserName : studentUserName,
        message: inputMessage,
        sessionId,
      };
  
      socket.emit('chatmessage', messageData);
      setInputMessage('');
  
      try {
        const response = await fetch(API_ROUTES.CHAT_SERVICE.SAVE_CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });
  
        if (!response.ok) {
          console.error('Error saving message:', response.statusText);
        }
      } catch (error) {
        console.error('Error in API call to save message:', error);
      }
    }
  };

  const handleSelectAnswer = (messageIndex, answerIndex) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg, idx) =>
        idx === messageIndex ? { ...msg, selectedAnswer: answerIndex } : msg
      )
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleSubmitMCQ = async (messageIndex) => {
    const selectedMCQ = messages[messageIndex];
    if (selectedMCQ.selectedAnswer !== undefined) {
      const mcqData = selectedMCQ.mcqData;
      const questionId = mcqData.id;
      const selectedAnswerIndex = selectedMCQ.selectedAnswer;
      const selectedAnswerText = mcqData.answers[selectedAnswerIndex].text;
      
      try {
        const response = await fetch(`${API_ROUTES.SESSION_SERVICE.SAVE_POINTS}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            selectedAnswerIndex,
            selectedAnswerText,
            studentUserName,
            studentUserId,
            questionText: mcqData.question,
            sessionId,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.message === "Correct Answer. Points saved successfully" && onCorrectAnswer) {
            onCorrectAnswer(true);
          }
        }
      } catch (error) {
        console.error('Error submitting MCQ:', error);
      }
    }
  };

  if (sessionStatus === "Deactivate") {
    return (
      <div className="p-5 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Session is not active</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div
        ref={messageContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-700"
      >
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${message.role === 'trainer' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex ${message.role === 'trainer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3/4 rounded-lg p-3 ${message.role === 'trainer' 
                ? 'bg-primary-500 text-white rounded-br-none' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}
              >
                <div className="font-bold text-sm mb-1">{message.username}</div>
                
                {message.type === 'mcq' ? (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-2">
                    {message.mcqData?.questionType && message.mcqData.questionType !== 'text-text' ? (
                      <div>
                        {message.mcqData.questionType === 'video-text' ? (
                          <video 
                            controls 
                            className="max-w-xs max-h-48 mb-2 rounded"
                          >
                            <source src={message.mcqData.question} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={message.mcqData.question}
                            alt="Question media"
                            className="max-w-xs max-h-48 mb-2 rounded"
                          />
                        )}
                        {message.mcqData.questionText && (
                          <p className="text-gray-800 dark:text-gray-200">{message.mcqData.questionText}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
                    )}

                    {message.mcqData?.questionType === 'image-image' && message.mcqData.answerMediaUrls?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {message.mcqData.answerMediaUrls.map((url, answerIndex) => (
                          <div key={answerIndex} className="text-center">
                            <input
                              type="radio"
                              id={`mcq_${index}_${answerIndex}`}
                              name={`mcq_${index}`}
                              value={answerIndex}
                              checked={message.selectedAnswer === answerIndex}
                              onChange={() => handleSelectAnswer(index, answerIndex)}
                              disabled={isTrainer}
                              className="mb-2"
                            />
                            <label htmlFor={`mcq_${index}_${answerIndex}`} className="block">
                              <img
                                src={url}
                                alt={`Answer ${answerIndex + 1}`}
                                className="max-w-full h-24 mx-auto rounded"
                              />
                              {message.mcqData.answers?.[answerIndex] && (
                                <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                                  {message.mcqData.answers[answerIndex].text}
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2 mt-3">
                        {message.mcqData?.answers?.map((answer, answerIndex) => (
                          <li key={answerIndex} className="flex items-center">
                            <input
                              type="radio"
                              id={`mcq_${index}_${answerIndex}`}
                              name={`mcq_${index}`}
                              value={answer.text}
                              checked={message.selectedAnswer === answerIndex}
                              onChange={() => handleSelectAnswer(index, answerIndex)}
                              disabled={isTrainer}
                              className="mr-2"
                            />
                            <label 
                              htmlFor={`mcq_${index}_${answerIndex}`} 
                              className="text-gray-800 dark:text-gray-200"
                            >
                              {answer.text}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isTrainer && (
                      <Button 
                        onClick={() => handleSubmitMCQ(index)} 
                        variant="primary"
                        size="small"
                        className="mt-3"
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-800 dark:text-gray-200">
                    {message.content}
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button 
            onClick={handleSendMessage}
            variant="primary"
            className="flex-shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;