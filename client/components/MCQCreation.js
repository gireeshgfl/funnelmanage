import React, { useState, useContext } from 'react';
import { SocketContext } from '@/context/socketContext';
import { Input, Button, Card } from '@components/ui/components';
import { CheckCircle, Edit2, Trash2, Plus, Send } from 'lucide-react';
import { List } from 'lucide-react';

const MCQCreation = ({ pushMCQsToChat }) => {
  const { socket } = useContext(SocketContext);
  
  const [mcqQuestions, setMCQQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']); 
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(null);

  const handleQuestionChange = (e) => setQuestionText(e.target.value);

  const handleAnswerChange = (index, e) => {
    const newAnswers = [...answers];
    newAnswers[index] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleAddQuestion = () => {
    if (!questionText.trim() || answers.some(a => !a.trim())) {
      alert('Please provide both the question and all possible answers.');
      return;
    }

    const mcq = {
      question: questionText,
      answers: answers.map((text, i) => ({
        text,
        isCorrect: i === correctAnswerIndex
      })),
      correctAnswerIndex
    };

    if (editIndex !== null) {
      const updated = [...mcqQuestions];
      updated[editIndex] = mcq;
      setMCQQuestions(updated);
      setEditIndex(null);
    } else {
      setMCQQuestions([...mcqQuestions, mcq]);
    }

    // Reset form
    setQuestionText('');
    setAnswers(['', '', '', '']);
    setCorrectAnswerIndex(0);
  };

  const handleDeleteQuestion = (index) => {
    setMCQQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const handleEditQuestion = (index) => {
    const q = mcqQuestions[index];
    setQuestionText(q.question);
    setAnswers(q.answers.map(a => a.text));
    setCorrectAnswerIndex(q.correctAnswerIndex);
    setEditIndex(index);
  };

  const handlePushMCQs = () => {
    if (!mcqQuestions.length) {
      alert('No MCQ questions to send.'); 
      return;
    }

    if (pushMCQsToChat) {
      pushMCQsToChat(mcqQuestions);
    } else if (socket) {
      socket.emit('pushMCQs', mcqQuestions);
    }
    
    setMCQQuestions([]);
  };

  return (
    <div className="space-y-6">
      {/* MCQ Creation Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-500" />
          {editIndex !== null ? 'Edit Question' : 'Create New Question'}
        </h2>
        
        <Input
          label="Question Text"
          value={questionText}
          onChange={handleQuestionChange}
          placeholder="Enter your question..."
          className="mb-4"
        />
        
        <div className="space-y-4 mb-6">
          {answers.map((answer, i) => (
            <div key={i} className="space-y-2">
              <Input
                label={`Option ${i + 1}`}
                value={answer}
                onChange={(e) => handleAnswerChange(i, e)}
                placeholder={`Enter option ${i + 1}`}
              />
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswerIndex === i}
                  onChange={() => setCorrectAnswerIndex(i)}
                  className="h-4 w-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mark as correct answer
                </span>
              </label>
            </div>
          ))}
        </div>

        <Button
          onClick={handleAddQuestion}
          variant="primary"
          className="w-full"
          icon={editIndex !== null ? <Edit2 size={18} /> : <Plus size={18} />}
        >
          {editIndex !== null ? 'Update Question' : 'Add Question'}
        </Button>
      </Card>

      {/* Questions List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <List className="h-5 w-5 text-primary-500" />
            Your Questions ({mcqQuestions.length})
          </h2>
          <Button
            onClick={handlePushMCQs}
            variant="primary"
            disabled={!mcqQuestions.length}
            icon={<Send size={18} />}
          >
            Push to Chat
          </Button>
        </div>

        {mcqQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No questions created yet
          </div>
        ) : (
          <div className="space-y-4">
            {mcqQuestions.map((mcq, i) => (
              <div key={i} className="border rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg mb-2">
                    Q{i + 1}: {mcq.question}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditQuestion(i)}
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 size={16} />}
                    />
                    <Button
                      onClick={() => handleDeleteQuestion(i)}
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      className="text-red-500 hover:text-red-600"
                    />
                  </div>
                </div>
                
                <ul className="space-y-2 mt-2">
                  {mcq.answers.map((ans, j) => (
                    <li key={j} className="flex items-center space-x-2">
                      {ans.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                      <span className={ans.isCorrect ? 'font-medium text-green-600' : ''}>
                        {ans.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MCQCreation;