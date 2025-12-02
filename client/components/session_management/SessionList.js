'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button, Modal, Tooltip } from '@/components/ui/components';
import { Copy, Edit, Archive, Trash2, Play, Power, Reply, Calendar, Tag, MessageCircle, Clock, MoreVertical } from 'lucide-react';
import { encryptId } from '@/utils/encryption';

const SessionCard = ({ session, onEdit, onDelete, onArchive, onUnarchive, onJoin, onActivate }) => {
  const [showAllQuestions, setShowAllQuestions] = React.useState(false);

  const copySessionUrl = (event, sessionId) => {
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_HOST_ENDPOINT}/funnel-management/dashboard/student/${encryptId(sessionId)}`);
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
    setTimeout(() => {
      button.innerHTML = originalContent;
    }, 2000);
  };

  const isActive = session.status === 'Activate';
  const isArchived = session.archived === "True";
  const dateObj = new Date(session.date);
  const day = !isNaN(dateObj) ? dateObj.getDate() : session.date.split('-')[2] || 'DD';
  const month = !isNaN(dateObj) ? dateObj.toLocaleString('default', { month: 'short' }) : 'MMM';

  return (
    <>
      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <div className={`
          group relative h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg
          border border-gray-100 dark:border-gray-700 flex flex-row transition-all duration-300
          ${isActive ? 'ring-1 ring-primary-500/30 dark:ring-primary-400/30' : ''}
        `}>

          {/* Calendar Block (Left Side) */}
          <div className={`
            w-24 flex-shrink-0 flex flex-col items-center justify-center p-2 text-center rounded-l-2xl
            ${isActive
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
          `}>
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">{month}</span>
            <span className="text-3xl font-bold leading-none my-1">{day}</span>
            <div className={`h-0.5 w-8 my-2 ${isActive ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className="flex flex-col items-center text-xs opacity-90">
              <Clock className="w-3.5 h-3.5 mb-0.5" />
              <span>
                {(() => {
                  try {
                    const [hours, minutes] = session.time.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours, 10));
                    date.setMinutes(parseInt(minutes, 10));
                    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                  } catch (e) {
                    return session.time;
                  }
                })()}
              </span>
            </div>
          </div>

          {/* Content Block (Right Side) */}
          <div className="flex-1 p-4 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 h-5">
                  {isActive ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  ) : isArchived ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Archived
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {session.sessionName}
                </h3>
              </div>

              {/* Quick Action: Join/Start */}
              <div className="flex-shrink-0">
                {isActive ? (
                  <div className="flex items-center gap-1">
                    <Tooltip content="Deactivate Session">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onActivate(session._id)}
                        className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        <Power className="w-4 h-4" />
                      </motion.button>
                    </Tooltip>
                    <Tooltip content="Join Session">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onJoin(session._id)}
                        className="p-2 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </motion.button>
                    </Tooltip>
                  </div>
                ) : (
                  <Tooltip content="Activate Session">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onActivate(session._id)}
                      className="p-2 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                    >
                      <Power className="w-4 h-4" />
                    </motion.button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col gap-2">
              {session.topic && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{session.topic}</span>
                </div>
              )}

              {session.questions?.length > 0 && (
                <div className="flex items-start gap-2 mt-1">
                  <MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {session.questions.slice(0, 2).map((q, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                        {q.name}
                      </span>
                    ))}
                    {session.questions.length > 2 && (
                      <Tooltip content="View all questions">
                        <button onClick={() => setShowAllQuestions(true)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline px-1">
                          +{session.questions.length - 2}
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions (Reveal on hover or always visible but subtle) */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex gap-1">
                <Tooltip content="Edit Session">
                  <button onClick={() => onEdit(session)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                {session.archive_eligibility === "True" ? (
                  isArchived ? (
                    <Tooltip content="Unarchive Session">
                      <button onClick={() => onUnarchive(session._id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Archive Session">
                      <button onClick={() => onArchive(session._id)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )
                ) : (
                  <Tooltip content="Delete Session">
                    <button onClick={() => onDelete(session._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Copy Session Link" className="right-0 left-auto translate-x-0 origin-bottom-right">
                  <button
                    onClick={(e) => copySessionUrl(e, session._id)}
                    className="text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Link
                  </button>
                </Tooltip>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Questions Modal */}
      <Modal
        isOpen={showAllQuestions}
        onClose={() => setShowAllQuestions(false)}
        className="max-w-lg"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl text-secondary-500">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Session Questions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.sessionName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAllQuestions(false)}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            <div className="flex flex-wrap gap-2">
              {session.questions.map((question, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                >
                  {question.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setShowAllQuestions(false)}
              variant="outline"
              className="min-w-[100px]"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const SessionList = ({ sessions, filterType, onEdit, onDelete, onArchive, onUnarchive, onJoin, onActivate }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {filterType === 'archived' ? "No archived sessions" : "No sessions found"}
        </h3>
        {filterType !== 'archived' && (
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
            Get started by creating your first session to manage your questions and participants.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      {sessions.map((session, index) => (
        <motion.div
          key={session._id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
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