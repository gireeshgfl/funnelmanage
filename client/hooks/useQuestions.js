import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/config';

export const useQuestions = (topicId) => {
  const [questions, setQuestions] = useState([]);
  const [questionIds, setQuestionIds] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchQuestions = async () => {
    try {
      console.log('Fetching questions...');
      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.GET_QUESTIONS}?id=${topicId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }
      const responseData = await response.json();
      const fetchedQuestions = responseData.data;
      console.log('Questions fetched successfully:', fetchedQuestions);
      
      const ids = fetchedQuestions.map(question => question._id);
      
      const questionsWithoutIds = fetchedQuestions.map(({_id, ...rest}) => rest);
      
      setQuestions(questionsWithoutIds);
      setQuestionIds(ids);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setFeedbackMessage('Failed to fetch questions. Please try again.');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topicId]);

  return { questions, questionIds, feedbackMessage, setFeedbackMessage, fetchQuestions };
};