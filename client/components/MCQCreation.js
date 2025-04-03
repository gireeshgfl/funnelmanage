import React, { useState, useContext } from 'react';
import { SocketContext } from '@/context/socketContext';
import { Input, Button } from '@components/ui/components';

const MCQCreation = () => {
  const { socket } = useContext(SocketContext);
  
  const [mcqQuestions, setMCQQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']); 
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0); 
  const [editIndex, setEditIndex] = useState(null); 

  const handleQuestionChange = (event) => {
    setQuestionText(event.target.value);
  };

  const handleAnswerChange = (index, event) => {
    const newAnswers = [...answers];
    newAnswers[index] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleCorrectAnswerChange = (index) => {
    setCorrectAnswerIndex(index);
  };

  const handleAddQuestion = () => {
    if (questionText.trim() === '' || answers.some(answer => answer.trim() === '')) {
      alert('Please provide both the question and all possible answers.');
      return;
    }

    const mcq = {
      question: questionText,
      answers: answers.map((answer, index) => ({
        text: answer,
        isCorrect: index === correctAnswerIndex
      })),
      correctAnswerIndex: correctAnswerIndex,
    };

    if (editIndex !== null) {
      const updatedQuestions = [...mcqQuestions];
      updatedQuestions[editIndex] = mcq;
      setMCQQuestions(updatedQuestions);
      setEditIndex(null);
    } else {
      setMCQQuestions([...mcqQuestions, mcq]);
    }

    setQuestionText('');
    setAnswers(['', '', '', '']);
    setCorrectAnswerIndex(0);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = [...mcqQuestions];
    updatedQuestions.splice(index, 1);
    setMCQQuestions(updatedQuestions);
  };

  const handleEditQuestion = (index) => {
    const selectedQuestion = mcqQuestions[index];
    setQuestionText(selectedQuestion.question);
    setAnswers(selectedQuestion.answers.map(answer => answer.text));
    setCorrectAnswerIndex(selectedQuestion.correctAnswerIndex);
    setEditIndex(index);
  };

  const handlePushMCQs = () => {
    if (mcqQuestions.length === 0) {
      alert('No MCQ questions to send.'); 
      return;
    }

    if (socket) {
      socket.emit('pushMCQs', mcqQuestions);
      console.log('MCQ questions sent to chat box:', mcqQuestions);
    } else {
      console.error('Socket connection not available.');
    }
    
    setMCQQuestions([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Trainer Interface</h1>
      
      {/* MCQ Creation Form */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {editIndex !== null ? 'Edit' : 'Create'} MCQ
        </h2>
        
        {/* Input field for question */}
        <Input
          label="Question"
          value={questionText}
          onChange={handleQuestionChange}
          placeholder="Enter your question..."
          className="mb-4"
        />
        
        {/* Input fields for possible answers */}
        {answers.map((answer, index) => (
          <div key={index} className="mb-4">
            <Input
              label={`Answer ${index + 1}`}
              value={answer}
              onChange={(event) => handleAnswerChange(index, event)}
              placeholder={`Enter answer ${index + 1}...`}
              className="mb-2"
            />
            {/* Radio button to select correct answer */}
            <div className="flex items-center mb-4">
              <input
                type="radio"
                id={`correct-answer-${index}`}
                checked={correctAnswerIndex === index}
                onChange={() => handleCorrectAnswerChange(index)}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <label htmlFor={`correct-answer-${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Correct answer
              </label>
            </div>
          </div>
        ))}
        
        {/* Add button to add new question */}
        <Button
          onClick={handleAddQuestion}
          variant="primary"
          className="mt-4"
        >
          {editIndex !== null ? 'Update' : 'Add'} Question
        </Button>
      </div>

      {/* Display MCQ questions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">MCQ Questions</h2>
        {mcqQuestions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No questions added yet</p>
        ) : (
          <div className="space-y-4">
            {mcqQuestions.map((mcq, index) => (
              <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {`Question ${index + 1}: ${mcq.question}`}
                </h3>
                <ul className="space-y-1 mb-3">
                  {mcq.answers.map((answer, answerIndex) => (
                    <li 
                      key={answerIndex} 
                      className={`text-sm ${answer.isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      {answer.text} {answer.isCorrect && '(Correct)'}
                    </li>
                  ))}
                </ul>
                {/* Buttons for editing and deleting questions */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleEditQuestion(index)} 
                    variant="outline"
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteQuestion(index)} 
                    variant="danger"
                    size="small"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Button to push MCQs to chat box */}
      <Button 
        onClick={handlePushMCQs} 
        variant="primary"
        disabled={mcqQuestions.length === 0}
        className="w-full md:w-auto"
      >
        Push MCQs
      </Button>
    </div>
  );
};

export default MCQCreation;