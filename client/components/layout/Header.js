'use client';

import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import Link from 'next/link';
import { Filter, BookOpen, Gift, Calendar, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ onCollapseChange, initialCollapsed = true }) {
  const { signout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const handleSignout = async () => {
    try {
      await signout();
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Signout failed:', error);
    }
  };

  const toggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange && onCollapseChange(newCollapsed);
  };

  return (
    <>
      {/* Mobile menu button - only shows on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none bg-white dark:bg-gray-800 p-2 rounded-md shadow"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <Link href="/funnel-management/dashboard/trainer" className="flex items-center space-x-2">
              <Filter className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Funnel Management
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/funnel-management/dashboard/trainer" className="flex justify-center w-full">
              <Filter className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link 
            href="/funnel-management/dashboard/trainer/sessions" 
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-3'
            } py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
          >
            <Calendar className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sessions</span>}
          </Link>
          <Link 
            href="/funnel-management/dashboard/trainer/question-bank" 
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-3'
            } py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
          >
            <BookOpen className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Question Bank</span>}
          </Link>
          <Link 
            href="/funnel-management/dashboard/trainer/funnels" 
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-3'
            } py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
          >
            <Filter className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Funnels</span>}
          </Link>
          <Link 
            href="/funnel-management/dashboard/trainer/rewards" 
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-3'
            } py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
          >
            <Gift className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Rewards</span>}
          </Link>
        </nav>

        {/* Account Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center w-full ${
                collapsed ? 'justify-center' : 'justify-between'
              } text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <svg 
                    className="h-5 w-5 text-primary-600 dark:text-primary-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {!collapsed && <span className="ml-3">Account</span>}
              </div>
              {!collapsed && (
                <svg 
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isDropdownOpen && !collapsed && (
              <div className="mt-2 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Profile
                </Link>
                <Link 
                  href="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-72 h-full bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/funnel-management/dashboard/trainer" className="flex items-center space-x-2">
                <Filter className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Funnel Management
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 px-2 pt-2 pb-3 space-y-1 overflow-y-auto">
              <Link
                href="/funnel-management/dashboard/trainer/sessions"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="h-5 w-5" />
                <span>Sessions</span>
              </Link>
              <Link
                href="/funnel-management/dashboard/trainer/question-bank"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                <span>Question Bank</span>
              </Link>
              <Link
                href="/funnel-management/dashboard/trainer/funnels"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Filter className="h-5 w-5" />
                <span>Funnels</span>
              </Link>
              <Link
                href="/funnel-management/dashboard/trainer/rewards"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Gift className="h-5 w-5" />
                <span>Rewards</span>
              </Link>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <svg 
                    className="h-6 w-6 text-primary-600 dark:text-primary-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">Account</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleSignout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}