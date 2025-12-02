'use client';

import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Filter, BookOpen, Gift, Calendar, Menu, X, ChevronLeft, ChevronRight, User, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ onCollapseChange, initialCollapsed = true }) {
  const { signout } = useAuth();
  const pathname = usePathname();
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

  const isActive = (path) => pathname?.startsWith(path);

  const navItems = [
    { href: '/dashboard/trainer/sessions', label: 'Sessions', icon: Calendar },
    { href: '/dashboard/trainer/question-bank', label: 'Question Bank', icon: BookOpen },
    { href: '/dashboard/trainer/funnels', label: 'Funnels', icon: Filter },
    { href: '/dashboard/trainer/rewards', label: 'Rewards', icon: Gift },
  ];

  return (
    <>
      {/* Mobile menu button - only shows on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none bg-white dark:bg-gray-800 p-2 rounded-md shadow-md transition-colors"
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
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-72'
          } bg-gray-50 dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-800`}
      >
        {/* Logo/Brand */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-6'} h-20 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`}>
          {!collapsed ? (
            <Link href="/dashboard/trainer" className="flex items-center space-x-3 group">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Funnel Management
              </span>
            </Link>
          ) : (
            <Link href="/dashboard/trainer" className="flex justify-center w-full group">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </Link>
          )}

          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Collapse Toggle Button (Floating when collapsed) */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors z-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'
                  } py-3 rounded-xl transition-all duration-200 group relative ${active
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'} transition-colors`} />

                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Account Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center w-full ${collapsed ? 'justify-center' : 'justify-between px-2'
                } p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 outline-none`}
            >
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center shadow-sm border border-primary-200 dark:border-primary-700">
                  <User className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                </div>
                {!collapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Account</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trainer</p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? '-rotate-90' : ''}`}
                />
              )}
            </button>

            {isDropdownOpen && (
              <div className={`absolute bottom-full ${collapsed ? 'left-full ml-2' : 'left-0 w-full mb-2'} bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                  <button
                    onClick={handleSignout}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - Keeping existing structure but updating styles */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-72 h-full bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <Link href="/dashboard/trainer" className="flex items-center space-x-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Funnel Mgmt
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={`h-5 w-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center px-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center shadow-sm border border-primary-200 dark:border-primary-700">
                  <User className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Account</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Trainer</div>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleSignout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
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