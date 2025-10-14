'use client';
import React from 'react';
import Header from '@/components/layout/SHeader';

const Layout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-grow overflow-hidden">
        <div className="h-full w-full overflow-hidden">
          {children}
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Eduvocate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;