import { useCallback } from 'react';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const useQuestionOperations = (fetchQuestions, setFeedbackMessage, topicId) => {

  const handleAdd = useCallback(async (newQuestion) => {
    if (!newQuestion || !newQuestion.answers) {
      setFeedbackMessage('Invalid question data. Please check all fields.');
      return;
    }

    const isQuestionEmpty = newQuestion.question.trim() === '';
    const isAnyAnswerEmpty = newQuestion.answers.some(answer => answer.trim() === '');

    if (isQuestionEmpty || isAnyAnswerEmpty) {
      setFeedbackMessage('Please fill in all fields before adding a question.');
      return;
    }

    try {
      const questionData = { ...newQuestion, topicId };

      await apiClient.post(API_ROUTES.QUESTION_SERVICE.SAVE_QUESTIONS, questionData);

      setFeedbackMessage('Question added successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      setFeedbackMessage('Failed to add question. Please try again.');
    }
  }, [fetchQuestions, setFeedbackMessage, topicId]);

  const handleUpdate = useCallback(async (updatedQuestion, questionId) => {
    if (updatedQuestion.question.trim() === '' || updatedQuestion.answers.some(answer => answer.trim() === '')) {
      setFeedbackMessage('Please fill in all fields before updating the question.');
      return;
    }

    try {
      // Prepare the updated question data by adding the question ID.
      let questionData = { ...updatedQuestion, _id: questionId };

      await apiClient.put(API_ROUTES.QUESTION_SERVICE.UPDATE_QUESTION, questionData);

      setFeedbackMessage('Question updated successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      setFeedbackMessage('Failed to update question. Please try again.');
    }
  }, [fetchQuestions, setFeedbackMessage]);

  const handleDelete = useCallback(async (questionId) => {
    try {
      await apiClient.delete(`${API_ROUTES.QUESTION_SERVICE.DELETE_QUESTION}?id=${questionId}`);

      setFeedbackMessage('Question deleted successfully!');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      setFeedbackMessage('Failed to delete question. Please try again.');
    }
  }, [fetchQuestions, setFeedbackMessage]);

  return { handleAdd, handleUpdate, handleDelete };
};
