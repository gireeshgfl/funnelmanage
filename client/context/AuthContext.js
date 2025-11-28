"use client";

import React, { createContext, useState, useEffect } from 'react';
import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get(API_ROUTES.AUTH_SERVICE.USER, { skipAuthRedirect: true });
        if (response.status === 200) {
          setUser(response.data);
        } else {
          setUser(null);
          setError('Not authenticated');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};