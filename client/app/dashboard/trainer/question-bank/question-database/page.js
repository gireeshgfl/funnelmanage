'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, Folder, ArrowRight, Layers } from 'lucide-react';

const QuestionDatabase = () => {
    const router = useRouter();

    const options = [
        {
            id: 'general',
            title: 'General Questions',
            description: 'View and manage questions that can be added to any session when creating sessions.',
            icon: <Database className="h-8 w-8 text-blue-500" />,
            color: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
            path: '/dashboard/trainer/question-bank/question-database/general-questions'
        },
        {
            id: 'session',
            title: 'Session Questions',
            description: 'View and manage questions that were created during a session.',
            icon: <Layers className="h-8 w-8 text-purple-500" />,
            color: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800',
            hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
            path: '/dashboard/trainer/question-bank/question-database/session-questions'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12 text-center"
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Question Database
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Select a category to manage your question bank. You can access general questions or view session-specific collections.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {options.map((option, index) => (
                    <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(option.path)}
                        className={`
              relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-300
              ${option.borderColor} ${option.hoverBorder} bg-white dark:bg-gray-800 shadow-sm hover:shadow-md
            `}
                    >
                        <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full ${option.color} opacity-50 blur-xl`}></div>

                        <div className="p-8 relative z-10">
                            <div className={`inline-flex p-3 rounded-xl ${option.color} mb-6`}>
                                {option.icon}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                {option.title}
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </h3>

                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {option.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default QuestionDatabase;
