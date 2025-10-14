'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Edit3, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { API_ROUTES } from '@/config';

export default function TopicSelectionForm() {
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  const topics = ['JavaScript', 'React', 'Python', 'Machine Learning', 'Web Design', 'Software Engineering', 'Custom'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_ROUTES.AUTH_SERVICE.USER}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data.user_id);
        } else {
          setFeedbackMessage('Not authenticated');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setFeedbackMessage('Failed to fetch user information');
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    switch (name) {
      case 'topic':
        setTopic(value);
        setIsCustomTopic(value === 'Custom');
        break;
      case 'customTopic':
        setCustomTopic(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'difficulty':
        setDifficulty(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedTopic = isCustomTopic ? customTopic : topic;
  
    if (!selectedTopic || !description || !difficulty || !userId) {
      setFeedbackMessage('Please fill in all fields before submitting.');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const saveRequestBody = {
        user_id: userId,
        data: {
          topic: selectedTopic,
          description: description,
          difficulty: difficulty,
        },
      };      
  
      const saveResponse = await fetch(`${API_ROUTES.QUESTION_SERVICE.SAVE_TOPIC}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveRequestBody),
      });
  
      if (!saveResponse.ok) {
        throw new Error(`Error saving topic: ${saveResponse.statusText}`);
      }
  
      const responseData = await saveResponse.json();
      const objectId = responseData.data._id;
  
      if (!objectId) {
        throw new Error('Failed to get the ObjectID of the newly created topic');
      }
  
      setTopic('');
      setCustomTopic('');
      setDescription('');
      setDifficulty('');
      setIsCustomTopic(false);
      setFeedbackMessage('Form submitted successfully!');
      
      router.push(`/dashboard/trainer/question-bank/session-topic/question-generation?topic=${selectedTopic}&topicId=${objectId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFeedbackMessage('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-8">
        <BookOpen className="h-8 w-8 text-primary-500 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Indicate Your Preferred Subject For Discussion
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Selection */}
        <div className="space-y-3">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Topic <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="topic"
              name="topic"
              value={topic}
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rounded-lg appearance-none transition-all duration-200"
            >
              <option value="">Select Topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
          </div>
        </div>

        {/* Custom Topic */}
        {isCustomTopic && (
          <div className="space-y-3">
            <label htmlFor="customTopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Custom Topic <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Edit3 className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <input
                type="text"
                id="customTopic"
                name="customTopic"
                value={customTopic}
                onChange={handleChange}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rounded-lg transition-all duration-200"
                placeholder="Enter your custom topic"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-3">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3">
              <FileText className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={handleChange}
              rows={5}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rounded-lg transition-all duration-200"
              placeholder="Describe your topic in detail..."
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="difficulty"
              name="difficulty"
              value={difficulty}
              onChange={handleChange}
              className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white rounded-lg appearance-none transition-all duration-200"
            >
              <option value="">Select Difficulty</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-lg mt-4 ${
              feedbackMessage.includes('Failed') || feedbackMessage.includes('Please fill')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-500'
            }`}
          >
            {feedbackMessage}
          </div>
        )}
      </form>
    </div>
  );
}