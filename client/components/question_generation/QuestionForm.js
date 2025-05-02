import React, { useState, useEffect } from 'react';
import useMediaUpload from '@/hooks/useMediaUpload';

export const QuestionForm = ({ onSubmit, initialData, onCancel, topicId }) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [points, setPoints] = useState([0, 0, 0, 0]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [questionType, setQuestionType] = useState('text-text');
  const [questionFile, setQuestionFile] = useState(null);
  const [questionFilePreview, setQuestionFilePreview] = useState(null);
  const [answerFiles, setAnswerFiles] = useState([null, null, null, null]);
  const [answerFilePreviews, setAnswerFilePreviews] = useState([null, null, null, null]);
  const [questionText, setQuestionText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pointsError, setPointsError] = useState(false);

  const { uploadQuestionMedia } = useMediaUpload();

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      setAnswers(initialData.answers || ['', '', '', '']);
      setPoints(initialData.points || [0, 0, 0, 0]);
      setCorrectAnswerIndex(initialData.correctAnswerIndex || 0);
      setQuestionType(initialData.questionType || 'text-text');
      setQuestionText(initialData.questionText || '');
      setQuestionFile(initialData.questionFile || null);
      setQuestionFilePreview(initialData.questionFile || null);
      setAnswerFiles(initialData.answerFiles || [null, null, null, null]);
      setAnswerFilePreviews(initialData.answerFiles || [null, null, null, null]);
    }
  }, [initialData]);

  const resetForm = () => {
    setQuestion('');
    setAnswers(['', '', '', '']);
    setPoints([0, 0, 0, 0]);
    setCorrectAnswerIndex(0);
    setQuestionType('text-text');
    setQuestionFile(null);
    setQuestionFilePreview(null);
    setAnswerFiles([null, null, null, null]);
    setAnswerFilePreviews([null, null, null, null]);
    setQuestionText('');
    setErrorMessage('');
    setPointsError(false);
    onCancel && onCancel();
  };

  const validatePoints = () => {
    const allZero = points.every(point => point === 0);
    const correctAnswerHasZero = points[correctAnswerIndex] === 0;
    
    if (allZero) {
      setErrorMessage("At least one answer should have points greater than 0");
      setPointsError(true);
      return false;
    }
    
    if (correctAnswerHasZero) {
      setErrorMessage("The correct answer must have points greater than 0");
      setPointsError(true);
      return false;
    }
    
    setErrorMessage('');
    setPointsError(false);
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePoints()) {
      return;
    }

    if (questionType === 'text-text') {
      const submissionData = {
        question,
        answers,
        points,
        correctAnswerIndex,
        questionType,
        topicId,
      };
      onSubmit(submissionData);
      resetForm();
    } else {
      try {
        let uploadResult;
        if (questionType === 'image-image') {
          uploadResult = await uploadQuestionMedia(
            questionFile,
            answerFiles,
            topicId,
            { extraData: { questionText, answers } }
          );
        } else {
          uploadResult = await uploadQuestionMedia(
            questionFile,
            [null, null, null, null],
            topicId,
            { extraData: { questionText, answers } }
          );
        }

        if (!uploadResult.success && uploadResult.success !== undefined) {
          console.error("Media upload failed:", uploadResult.message);
          return;
        }

        const submissionData = {
          question: uploadResult.questionMediaUrl,
          questionText,
          answers,
          answerMediaUrls: questionType === 'image-image' ? uploadResult.answerMediaUrls : [null, null, null, null],
          points,
          correctAnswerIndex,
          questionType,
          topicId,
        };

        onSubmit(submissionData);
        resetForm();
      } catch (error) {
        console.error('Error uploading media:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Type Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Question Type
        </label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rounded-lg appearance-none"
        >
          <option value="text-text">Question: Text, Answer: Text</option>
          <option value="image-text">Question: Image, Answer: Text</option>
          <option value="image-image">Question: Image, Answer: Image</option>
          <option value="video-text">Question: Video, Answer: Text</option>
        </select>
      </div>

      {/* Question Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Question
        </label>
        {questionType === 'text-text' ? (
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        ) : (
          <div className="space-y-3">
            <input
              type="file"
              accept={questionType.startsWith('image') ? "image/*" : "video/*"}
              onChange={(e) => {
                const file = e.target.files[0];
                setQuestionFile(file);
                setQuestionFilePreview(URL.createObjectURL(file));
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                dark:file:bg-primary-900/20 dark:file:text-primary-300
                dark:hover:file:bg-primary-900/30"
            />
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter question text"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
            {questionFilePreview && (
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                {questionType.startsWith('image') ? (
                  <img 
                    src={questionFilePreview} 
                    alt="Question Preview" 
                    className="max-w-full max-h-[300px] mx-auto" 
                  />
                ) : (
                  <video 
                    controls 
                    className="max-w-full max-h-[300px] mx-auto"
                  >
                    <source src={questionFilePreview} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Fields */}
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-8 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Answer {index + 1}
            </label>
            {questionType === 'image-image' ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    const newAnswerFiles = [...answerFiles];
                    newAnswerFiles[index] = file;
                    setAnswerFiles(newAnswerFiles);
                    const newAnswerFilePreviews = [...answerFilePreviews];
                    newAnswerFilePreviews[index] = URL.createObjectURL(file);
                    setAnswerFilePreviews(newAnswerFilePreviews);
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900/20 dark:file:text-primary-300
                    dark:hover:file:bg-primary-900/30"
                />
                <input
                  type="text"
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="Enter answer text"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                {answerFilePreviews[index] && (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <img 
                      src={answerFilePreviews[index]} 
                      alt={`Answer ${index + 1} Preview`} 
                      className="max-w-full max-h-[150px] mx-auto" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={answers[index]}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[index] = e.target.value;
                  setAnswers(newAnswers);
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>
          
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Points
            </label>
            <input
              type="number"
              value={points[index]}
              onChange={(e) => {
                const newPoints = [...points];
                newPoints[index] = Math.max(0, parseInt(e.target.value) || 0);
                setPoints(newPoints);
                if (pointsError) {
                  setPointsError(false);
                  setErrorMessage('');
                }
              }}
              onFocus={(e) => e.target.select()}
              min="0"
              className={`block w-full px-3 py-2 border ${pointsError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [appearance:textfield]`}
            />
          </div>
          
          <div className="col-span-2 flex items-center h-full pb-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="correctAnswer"
                checked={correctAnswerIndex === index}
                onChange={() => setCorrectAnswerIndex(index)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Correct</span>
            </label>
          </div>
        </div>
      ))}

      {/* Form Buttons */}
      <div className="flex space-x-3 pt-4 items-center">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {initialData ? 'Update' : 'Add'} Question
        </button>
        {initialData && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
        {errorMessage && (
          <p className="text-red-500 text-sm ml-3">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};