"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuestions } from '@/hooks/useQuestions';
import { QuestionForm } from '@/components/question_generation/QuestionForm';
import { QuestionList } from '@/components/question_generation/QuestionList';
import { useQuestionOperations } from '@/hooks/useQuestionOperations';
import { getTopic } from '@/hooks/session_management/topicService';

function QuestionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');

  const { questions, questionIds, feedbackMessage, setFeedbackMessage, fetchQuestions } = useQuestions(topicId);
  const { handleDelete, handleUpdate, handleAdd } = useQuestionOperations(fetchQuestions, setFeedbackMessage, topicId);
  const [editIndex, setEditIndex] = useState(null);
  const [topicName, setTopicName] = useState('');

  React.useEffect(() => {
    const fetchTopicName = async () => {
      if (topicId) {
        try {
          const response = await getTopic(topicId);
          if (response?.data?.topic) {
            setTopicName(response.data.topic);
          }
        } catch (error) {
          console.error('Error fetching topic:', error);
        }
      }
    };
    fetchTopicName();
  }, [topicId]);

  const navigateToQuestionBank = () => {
    setFeedbackMessage('Session saved successfully!');
    router.push('/dashboard/trainer/question-bank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`mb-6 p-4 rounded-lg ${feedbackMessage.includes('Failed')
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500'
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-500'
          }`}>
          {feedbackMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Form Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-[810px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editIndex !== null ? 'Edit Question' : `Create Question for ${topicName}`}
            </h2>
            <QuestionForm
              onSubmit={(data) => {
                if (editIndex !== null) {
                  handleUpdate(data, questionIds[editIndex]);
                } else {
                  handleAdd(data);
                }
              }}
              initialData={editIndex !== null ? questions[editIndex] : null}
              onCancel={() => setEditIndex(null)}
              topicId={topicId}
            />
          </div>

          {/* Question List Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-[810px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Saved Questions
            </h2>
            <QuestionList
              questions={questions}
              onEdit={setEditIndex}
              onDelete={(index) => handleDelete(questionIds[index])}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={navigateToQuestionBank}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Save Session
        </button>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionPageContent />
    </Suspense>
  );
}