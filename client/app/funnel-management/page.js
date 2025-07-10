'use client'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {Filter} from 'lucide-react'

export default function WelcomePage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('color-theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const features = [
    {
      name: 'Funnel Analytics',
      description: 'Track conversion rates at each stage of your funnel with detailed analytics and visualizations.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Optimization Tools',
      description: 'Identify bottlenecks and optimize your funnel with A/B testing and smart recommendations.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      name: 'Scheduled Actions',
      description: 'Automate your funnel with scheduled emails, notifications, and follow-ups at key stages.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-full flex flex-col dark:bg-gray-900 transition-colors duration-200">
      <Head>
        <title>FunnelManagement Plugin</title>
        <meta name="description" content="Welcome to FunnelManagement - Powerful funnel management tools" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Header with Sign In button */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
              <Filter className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-xl  font-bold text-gray-900 dark:text-white">Funnel Management</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
            <Link 
                href="/login"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Rest of the content remains the same */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Welcome to</span>
              <span className="block text-primary-500">FunnelManagement</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-lg text-gray-600 dark:text-gray-300">
              Powerful funnel management tools integrated seamlessly with your application.
              Optimize your conversion paths and track performance with ease.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Get Started
                <svg className="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="#"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="pt-6">
                  <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8 shadow-md h-full transition-transform hover:scale-[1.02]">
                    <div className="-mt-6">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        {feature.icon}
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">{feature.name}</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2 space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span className="sr-only">Documentation</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span className="sr-only">Support</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
                </svg>
              </a>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-500 dark:text-gray-400">
                &copy; 2025 GoFreeLab. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}