import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '../config';
import apiClient from '@/utils/axiosinterceptor';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();



  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.REGISTER, userData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { message: errorMessage, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  const signin = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.SIGNIN, credentials);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { message: errorMessage, status: 401 };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(API_ROUTES.AUTH_SERVICE.SIGNOUT);
      const data = response.data;
      if (data.status === 200) {
        window.location = '/funnel-management/login';
      }
      return data;
    } catch (err) {
      // If signout fails (e.g. 401), we still want to redirect the user
      console.error("Signout failed:", err);
      window.location = '/funnel-management/login';
      setError(err.message);
      return { message: err.message, status: 400 };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const generateOTP = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.GENERATE_OTP, { email });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { message: errorMessage, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (changePasswordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.VERIFY_OTP_AND_CHANGE_PASSWORD, changePasswordData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { message: errorMessage, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, signup, signin, signout, generateOTP, changePassword };
};