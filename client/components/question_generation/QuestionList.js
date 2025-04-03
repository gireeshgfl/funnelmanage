import React from 'react';

export const QuestionList = ({ questions, onEdit, onDelete }) => {
  // Render question content based on type
  const renderQuestionContent = (question) => {
    switch (question.questionType) {
      case 'text-text':
        return <p className="text-gray-800 dark:text-gray-200">{question.question}</p>;
      case 'image-text':
      case 'image-image':
        return (
          <div className="space-y-3">
            <img
              src={question.question}
              alt="Question"
              className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <p className="text-gray-800 dark:text-gray-200">{question.questionText}</p>
          </div>
        );
      case 'video-text':
        return (
          <div className="space-y-3">
            <video 
              controls 
              className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <source src={question.question} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-gray-800 dark:text-gray-200">{question.questionText}</p>
          </div>
        );
      default:
        return <p className="text-gray-800 dark:text-gray-200">Unsupported question type</p>;
    }
  };

  // Render answer content
  const renderAnswerContent = (question) => {
    if (question.questionType === 'image-image') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {question.answerMediaUrls &&
            question.answerMediaUrls.map((url, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  index === question.correctAnswerIndex 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <img
                  src={url}
                  alt={`Answer ${index + 1}`}
                  className="max-w-[100px] max-h-[100px] mx-auto"
                />
                <p className="text-gray-800 dark:text-gray-200 mt-2 text-center">
                  {question.answers[index]}
                </p>
                <p className="text-sm text-center mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Points: {question.points[index] || 0}
                  </span>
                  {index === question.correctAnswerIndex && (
                    <span className="ml-2 text-green-600 dark:text-green-400">(Correct)</span>
                  )}
                </p>
              </div>
            ))}
        </div>
      );
    } else {
      return (
        <ul className="space-y-2">
          {question.answers.map((answer, index) => (
            <li 
              key={index}
              className={`p-3 rounded-lg border ${
                index === question.correctAnswerIndex 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-gray-800 dark:text-gray-200">{answer}</p>
              <p className="text-sm mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Points: {question.points[index] || 0}
                </span>
                {index === question.correctAnswerIndex && (
                  <span className="ml-2 text-green-600 dark:text-green-400">(Correct)</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      );
    }
  };

  return (
    <div className="space-y-4">
      {questions && questions.length > 0 ? (
        questions.map((q, index) => (
          <div 
            key={q._id} 
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Question:</h3>
            {renderQuestionContent(q)}
            
            <h4 className="text-md font-medium text-gray-900 dark:text-white mt-4 mb-3">Answers:</h4>
            {renderAnswerContent(q)}
            
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={() => onEdit(index)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(index)}
                className="px-4 py-2 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium rounded-lg shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No questions found.</p>
      )}
    </div>
  );
};