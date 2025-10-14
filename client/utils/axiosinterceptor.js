import axios from "axios";
import { API_ROUTES } from "@/config";

const apiClient = axios.create({
  baseURL: API_ROUTES.HOST.ENDPOINT,
  withCredentials: true, // Ensures cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        // Call refresh token API (cookies are sent automatically)
        await axios.post(API_ROUTES.AUTH_SERVICE.REFRESH_TOKEN, {}, { withCredentials: true });

        // Retry the original request
        return apiClient(error.config);
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        window.location.href = "/login"; // Redirect to login if refresh fails
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
