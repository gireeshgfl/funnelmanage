"use client";

import React, { createContext, useState, useEffect } from 'react';
import { API_ROUTES } from '@/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_ROUTES.AUTH_SERVICE.USER}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
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