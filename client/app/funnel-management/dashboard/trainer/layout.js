'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

const Layout = ({ children }) => {
  const pathname = usePathname();
  const isSessionWorkspace = pathname?.match(/^\/funnel-management\/dashboard\/trainer\/sessions\/[^/]+/);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Initial state set to true

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Hide Sidebar in session workspace */}
      {!isSessionWorkspace && (
        <Sidebar 
          onCollapseChange={setSidebarCollapsed} 
          initialCollapsed={sidebarCollapsed}
        />
      )}

      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          !isSessionWorkspace ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''
        }`}
      >
        <main className="flex-1 p-4 md:p-6">
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
    </div>
  );
};

export default Layout;