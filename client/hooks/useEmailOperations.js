import { useState, useCallback } from "react";
import axios from "axios";
import { API_ROUTES } from "@/config";

export function useEmailOperations() {
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const sendEmail = useCallback(async (email) => {
    setLoading(true);
    setFeedbackMessage("");

    try {
      const response = await axios.post(API_ROUTES.AUTH_SERVICE.PARTICIPANTS_TOKEN, {
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
