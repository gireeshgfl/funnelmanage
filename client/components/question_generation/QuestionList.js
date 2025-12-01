import React from 'react';

const QuestionItem = ({ question, index, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(false);

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

  const renderAnswerContent = (question) => {
    if (question.questionType === 'image-image') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {question.answerMediaUrls &&
            question.answerMediaUrls.map((url, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${idx === question.correctAnswerIndex
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
                  }`}
              >
                <img
                  src={url}
                  alt={`Answer ${idx + 1}`}
                  className="max-w-[100px] max-h-[100px] mx-auto"
                />
                <p className="text-gray-800 dark:text-gray-200 mt-2 text-center">
                  {question.answers[idx]}
                </p>
                <p className="text-sm text-center mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Points: {question.points[idx] || 0}
                  </span>
                  {idx === question.correctAnswerIndex && (
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
          {question.answers.map((answer, idx) => (
            <li
              key={idx}
              className={`p-3 rounded-lg border ${idx === question.correctAnswerIndex
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              <p className="text-gray-800 dark:text-gray-200">{answer}</p>
              <p className="text-sm mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Points: {question.points[idx] || 0}
                </span>
                {idx === question.correctAnswerIndex && (
                  <span className="ml-2 text-green-600 dark:text-green-400">(Correct)</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      );
    }
  };

  const getQuestionPreview = (question) => {
    if (question.questionType === 'text-text') {
      return question.question;
    }
    return question.questionText || 'Image/Video Question';
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium">
            {index + 1}
          </span>
          <p className="text-gray-900 dark:text-white font-medium truncate">
            {getQuestionPreview(question)}
          </p>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Question Details</h3>
          {renderQuestionContent(question)}

          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-3">Answers</h4>
          {renderAnswerContent(question)}

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(index);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="px-4 py-2 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium rounded-lg shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const QuestionList = ({ questions, onEdit, onDelete, title = "Questions" }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          {questions?.length || 0}
        </span>
      </div>

      <div className="space-y-4">
        {questions && questions.length > 0 ? (
          questions.map((q, index) => (
            <QuestionItem
              key={q._id || index}
              question={q}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No questions found.</p>
        )}
      </div>
    </div>
  );
};