import { API_ROUTES } from '@/config';

export const getTopics = async () => {
    const response = await fetch(API_ROUTES.QUESTION_SERVICE.GET_TOPICS, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error fetching topics: ${response.statusText}`);
    }
    const data = await response.json();
    return data?.data.map(topic => ({
      key: topic._id,
      text: topic.data.topic,
      value: topic._id,
      difficulty: topic.data.difficulty,
    }));
  };