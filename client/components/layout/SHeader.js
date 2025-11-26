'use client';
import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/components';

export default function Header() {
  const { signout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignout = async () => {
    try {
      await signout();
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Signout failed:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Navigation Links */}
          <div className="flex space-x-4">
            <a 
              href="/funnel-management" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Home
            </a>
            <a 
              href="/funnel-management/dashboard/student/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Student Dashboard
            </a>
            <a 
              href="/about" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              About
            </a>
          </div>

          {/* Account Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1"
            >
              <span>Account</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Profile
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Settings
                </a>
                <button
                  onClick={handleSignout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}