import { useState, useCallback } from "react";
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from "@/config";

export function useEmailOperations() {
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const sendEmail = useCallback(async (email) => {
    setLoading(true);
    setFeedbackMessage("");

    try {
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.PARTICIPANTS_TOKEN, {
        email,
      });

      setFeedbackMessage("Email submitted successfully!");
      return response.data;
    } catch (error) {
      setFeedbackMessage(
        error.response?.data?.message || "Failed to submit email"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendEmail, loading, feedbackMessage };
}
