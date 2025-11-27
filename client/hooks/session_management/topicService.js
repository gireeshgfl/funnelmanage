import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const getTopics = async () => {
  const response = await apiClient.get(API_ROUTES.QUESTION_SERVICE.GET_TOPICS);
  const data = response.data;
  return (data?.data || []).map(topic => ({
    key: topic._id,
    text: topic.data.topic,
    value: topic._id,
    difficulty: topic.data.difficulty,
  }));
};