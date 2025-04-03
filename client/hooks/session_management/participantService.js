import { API_ROUTES } from "@/config";

export const getParticipants = async () => {
  const response = await fetch(API_ROUTES.QUESTION_SERVICE.GET_PARTICIPANTS, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Error fetching participants: ${response.statusText}`);
  }

  const data = await response.json();

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
