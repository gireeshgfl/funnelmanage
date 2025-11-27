import { API_ROUTES } from "@/config";
import apiClient from '@/utils/axiosinterceptor';

export const getParticipants = async () => {
  const response = await apiClient.get(API_ROUTES.QUESTION_SERVICE.GET_PARTICIPANTS);
  const data = response.data;

  if (!data?.data) {
    throw new Error("Invalid API response format");
  }

  // Extract participant categories
  const { trainers, students, others } = data.data;

  // Merge all categories into one list and format for Dropdown
  return [...trainers, ...students, ...others].map((participant) => ({
    key: participant.email, // Using email as a unique identifier
    text: participant.fullName, // Display name in dropdown
    value: participant.email, // The value stored in state
  }));
};
