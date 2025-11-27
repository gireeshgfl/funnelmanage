// In useParticipantOperations.js
import { useState, useCallback } from "react";
import apiClient from "@/utils/axiosinterceptor";
import { API_ROUTES } from "@/config";

export function useSessionParticipantOperations(sessionId) {
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleAddParticipants = useCallback(
    async (emails) => {
      if (!emails || emails.length === 0) {
        setFeedbackMessage("Please provide valid email addresses.");
        return false;
      }

      // Validate all emails
      const invalidEmails = emails.filter(email => !email || email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (invalidEmails.length > 0) {
        setFeedbackMessage("One or more email addresses are invalid.");
        return false;
      }

      try {
        setLoading(true);
        setFeedbackMessage("");

        const res = await apiClient.post(
          API_ROUTES.SESSION_SERVICE.ADD_PARTICIPANTS,
          {
            sessionId,
            emails
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (res.status === 200 || res.status === 201) {
          setFeedbackMessage(`${emails.length} participant(s) added successfully!`);
          return true;
        } else {
          setFeedbackMessage(res.data?.message || "Failed to add participants.");
          return false;
        }
      } catch (err) {
        console.error("Error adding participants:", err);
        setFeedbackMessage(err.response?.data?.message || "Error occurred while adding participants.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return {
    handleAddParticipants,
    loading,
    feedbackMessage,
    setFeedbackMessage,
  };
}