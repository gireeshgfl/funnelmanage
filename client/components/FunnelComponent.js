import { useState } from 'react';
import { Input, Button } from './ui/components';

export default function FunnelComponent({
  participants,
  fetchFunnellingData,
  funnellingData,
  funnellingResponse,
  funnellingMessage,
  loadingFunnelling
}) {
  const [inputId, setInputId] = useState('');
  const [expandedSessions, setExpandedSessions] = useState({});

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const grouped = participants.reduce((acc, participant) => {
    const { sessionId, sessionName, username } = participant;
    if (!acc[sessionId]) {
      acc[sessionId] = { sessionName, usernames: [] };
    }
    acc[sessionId].usernames.push(username);
    return acc;
  }, {});

  const handleSearch = () => {
    if (inputId.trim()) fetchFunnellingData(inputId.trim());
  };

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
        Welcome to Funnelling
      </h1>

      {/* Participants Section with Scroll */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Participants
          </h2>
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          {Object.entries(grouped).map(([sessionId, group]) => (
            <div key={sessionId} className="mb-4 last:mb-0">
              <button
                onClick={() => toggleSession(sessionId)}
                className="w-full p-3 text-left flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Session: {group.sessionName}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                    expandedSessions[sessionId] ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSessions[sessionId] && (
                <div className="mt-2 pl-4">
                  <ul className="list-none space-y-1">
                    {group.usernames.map((name, idx) => (
                      <li key={idx} className="text-gray-600 dark:text-gray-400">- {name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Funnelling Section with Scroll */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Funnelling
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center mt-4">
            <Input
              type="text"
              placeholder="Enter Value for Funnelling"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={loadingFunnelling}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {loadingFunnelling ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {funnellingMessage && (
            <div className={`mt-4 p-3 rounded-lg text-center ${
              funnellingResponse?.status === 200 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            }`}>
              {funnellingMessage}
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {funnellingData && (
            <div className="p-4 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Results
              </h3>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-100 dark:bg-gray-700 p-3 font-medium text-gray-700 dark:text-gray-300">
                  <div className="col-span-4">Username</div>
                  <div className="col-span-2 text-center">Sessions</div>
                  <div className="col-span-6">Session Names</div>
                </div>
                
                {funnellingData.map((user, index) => (
                  <div 
                    key={user.userId} 
                    className={`grid grid-cols-12 p-3 items-center ${
                      index % 2 === 0 
                        ? 'bg-gray-50 dark:bg-gray-800' 
                        : 'bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="col-span-4 font-medium text-gray-800 dark:text-gray-200">
                      {user.username}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm font-medium">
                        {user.session_count}
                      </span>
                    </div>
                    <div className="col-span-6 flex flex-wrap gap-2">
                      {user.sessions.map((session, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {session.sessionName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}