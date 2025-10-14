'use client';
import React from 'react';
import { PlusCircle, Database, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuestionBank() {
  const router = useRouter();

  const cardLinks = [
    { 
      path: '/dashboard/trainer/question-bank/session-topic', 
      title: 'Question Creation',
      description: 'Crafting customized learning materials using multimedia elements to engage learners effectively.',
      icon: <PlusCircle className="h-8 w-8 text-primary-500" />,
      category: 'Educational Content Creation'
    },
    { 
      path: '/dashboard/trainer/question-bank/question-database', 
      title: 'Question Database',
      description: 'Organizing and storing educational materials for easy access and distribution.',
      icon: <Database className="h-8 w-8 text-primary-500" />,
      category: 'Educational Content Management'
    },
  ]; 

  const handleCardClick = (path) => {
    router.push(path); 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Question Bank Administration Hub
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Manage all your educational content in one centralized location for effective teaching and learning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardLinks.map((card, index) => (
          <div 
            key={index}
            onClick={() => handleCardClick(card.path)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer overflow-hidden hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                    {card.category}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {card.description}
              </p>
              <div className="mt-6 flex items-center text-primary-600 dark:text-primary-400 group">
                <span className="font-medium group-hover:underline">Get started</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}