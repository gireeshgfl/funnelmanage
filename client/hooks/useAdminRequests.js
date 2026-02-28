import { useState, useCallback } from "react";
import apiClient from "@/utils/axiosinterceptor";
import { API_ROUTES } from "@/config";

export function useAdminRequests() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const markRequestsSeen = useCallback(async (requestIds) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post(
                API_ROUTES.SESSION_SERVICE.MARK_REQUESTS_SEEN,
                { request_ids: requestIds }
            );

            if (response.data?.status === 200) {
                return true;
            } else {
                setError(response.data?.message || "Failed to mark requests as seen");
                return false;
            }
        } catch (err) {
            console.error("Error marking requests as seen:", err);
            setError(err.response?.data?.message || "Error occurred while marking requests as seen.");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        markRequestsSeen,
    };
}
