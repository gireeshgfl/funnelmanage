// /app/dashboard/trainer/layout.js
'use client';
import React from 'react';
import Header from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

const Layout = ({ children }) => {
  const pathname = usePathname();
  const isSessionWorkspace = pathname?.includes('/dashboard/trainer/sessions/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Hide Header in session workspace */}
      {!isSessionWorkspace && <Header />}

      <main className="flex-1">
        {children}
      </main>

      {/* Hide Footer in session workspace */}
      {!isSessionWorkspace && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
