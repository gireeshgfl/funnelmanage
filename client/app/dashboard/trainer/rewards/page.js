"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
    const router = useRouter();

    const handleCardClick = (url) => {
        router.push(url);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">
                Offers and Points
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offers Card */}
                <div 
                    onClick={() => handleCardClick('/funnel-management/dashboard/trainer/rewards/offers')}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow duration-300"
                >
                    <div className="p-6">
                        <div className="flex items-center mb-3">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Offers
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            View available coupons and deals
                        </p>
                    </div>
                </div>

                {/* Points Card */}
                <div 
                    onClick={() => handleCardClick('/funnel-management/dashboard/trainer/rewards/points')}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-green-200 dark:border-green-700 hover:shadow-lg transition-shadow duration-300"
                >
                    <div className="p-6">
                        <div className="flex items-center mb-3">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Points
                            </h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Check student's reward points balance
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;