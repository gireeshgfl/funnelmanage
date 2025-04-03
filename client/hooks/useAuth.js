import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '../config';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An unexpected error occurred');
    }
    return data;
  };

  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_SERVICE.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await handleResponse(response);
    } catch (err) {
      setError(err.message);
      return { message: err.message, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  const signin = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_SERVICE.SIGNIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await handleResponse(response);
      return data;
    } catch (err) {
      setError(err.message);
      return { message: err.message, status: 401 };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_SERVICE.SIGNOUT, {
        method: 'DELETE',
      });
      const data = await handleResponse(response);
      if (data.status === 200) {
        window.location = '/funnel-management';
      }
      return data;
    } catch (err) {
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
      const response = await fetch(API_ROUTES.AUTH_SERVICE.GENERATE_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await handleResponse(response);
    } catch (err) {
      setError(err.message);
      return { message: err.message, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (changePasswordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.AUTH_SERVICE.VERIFY_OTP_AND_CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changePasswordData),
      });
      return await handleResponse(response);
    } catch (err) {
      setError(err.message);
      return { message: err.message, status: 400 };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, signup, signin, signout, generateOTP, changePassword };
};