'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/components';
import { Copy, Edit, Archive, Trash2, Play, Power, Reply, Calendar, Tag, MessageCircle } from 'lucide-react';

const SessionCard = ({ session, onEdit, onDelete, onArchive, onUnarchive, onJoin, onActivate }) => {
  const copySessionUrl = (event, sessionId) => {
    navigator.clipboard.writeText(`http://localhost:3000/funnel-management/dashboard/student/${sessionId}`);
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
    setTimeout(() => {
      button.innerHTML = originalContent;
    }, 2000);
  };

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className={`
        relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm
        border border-gray-200 dark:border-gray-700 flex flex-col
        ${session.status === 'Activate' 
          ? 'ring-2 ring-primary-500 dark:ring-primary-400' 
          : ''}
      `}>
        {/* Card Header with colored gradient overlay - Reduced height */}
        <div className="relative h-24 bg-gradient-to-r from-primary-600 to-secondary-500 p-4 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative z-10 flex justify-between items-start h-full">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white truncate max-w-[90%]">
                {session.sessionName}
              </h3>
              
              <p className="text-xs text-white/80 flex items-center mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {session.date} at {session.time}
              </p>
            </div>
            
            {session.status === 'Activate' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/90 text-white">
                Active
              </span>
            )}
          </div>
        </div>
        
        {/* Card Content - Compact layout */}
        <div className="p-4 flex-1">
          {/* Topics as Tags */}
          {session.topic && (
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <Tag className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400 mr-1.5" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Topic</p>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                  {session.topic}
                </span>
              </div>
            </div>
          )}
          
          {/* Questions as Tags - Modified to show all questions */}
          {session.questions?.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <MessageCircle className="h-3.5 w-3.5 text-secondary-500 dark:text-secondary-400 mr-1.5" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Questions</p>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {session.questions.map((question, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-300"
                  >
                    {question.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Card Actions - Compact layout */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onEdit(session)}
              aria-label="Edit session"
            >
              <Edit className="h-3.5 w-3.5" />
            </motion.button>
            
            {session.archive_eligibility === "True" ? (
              session.archived === "True" ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                  onClick={() => onUnarchive(session._id)}
                  aria-label="Unarchive session"
                >
                  <Reply className="h-3.5 w-3.5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  onClick={() => onArchive(session._id)}
                  aria-label="Archive session"
                >
                  <Archive className="h-3.5 w-3.5" />
                </motion.button>
              )
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 rounded-full text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => onDelete(session._id)}
                aria-label="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-auto rounded-md px-2.5 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium flex items-center gap-1"
              onClick={() => onJoin(session._id)}
            >
              <Play className="h-3 w-3" />
              <span>Join</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${
                session.status === 'Activate' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-800/50'
              }`}
              onClick={() => onActivate(session._id)}
            >
              <Power className="h-3 w-3" />
              <span>{session.status === 'Activate' ? 'Deactivate' : 'Activate'}</span>
            </motion.button>
          </div>
          
          {/* Session URL - Compact */}
          <div className="flex items-center relative">
            <div className="relative flex-grow">
              <input
                type="text"
                value={`http://localhost:3000/funnel-management/dashboard/student/${session._id}`}
                readOnly
                className="w-full text-xs py-1.5 px-2 pr-10 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                URL
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-1.5 p-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white"
              onClick={(e) => copySessionUrl(e, session._id)}
            >
              <Copy className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SessionList = ({ sessions, filterType, onEdit, onDelete, onArchive, onUnarchive, onJoin, onActivate }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 rounded-xl p-4 text-center border border-dashed border-primary-200 dark:border-primary-800 transition-colors duration-300">
        <h3 className="font-medium text-base">
          {filterType === 'archived' ? "No sessions archived" : "No sessions to display"}
        </h3>
        {filterType !== 'archived' && (
          <p className="mt-1 text-primary-600 dark:text-primary-400 text-sm">
            Create a new session to get started
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {sessions.map((session, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="w-full"
        >
          <SessionCard
            session={session}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onJoin={onJoin}
            onActivate={onActivate}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default SessionList;