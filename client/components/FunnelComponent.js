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
    <main className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
        Welcome to Funnelling
      </h1>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Participants
        </h2>
        
        {Object.entries(grouped).map(([sessionId, group]) => (
          <div key={sessionId} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session: {group.sessionName}
            </h3>
            <ul className="list-none space-y-1">
              {group.usernames.map((name, idx) => (
                <li key={idx} className="text-gray-600 dark:text-gray-400">- {name}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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

        {funnellingData && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Funnelling Result
            </h2>
            
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
    </main>
  );
}