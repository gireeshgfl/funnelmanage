import { useState } from 'react';

export default function FunnelComponent({ participants, fetchFunnellingData, funnellingData, loadingFunnelling }) {
  const [inputId, setInputId] = useState('');

  const grouped = participants.reduce((acc, participant) => {
    const { sessionId, sessionName, username } = participant;

    if (!acc[sessionId]) {
      acc[sessionId] = {
        sessionName,
        usernames: [],
      };
    }

    acc[sessionId].usernames.push(username);
    return acc;
  }, {});

  const handleSearch = () => {
    if (inputId.trim()) {
      fetchFunnellingData(inputId.trim());
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Welcome to Funnelling</h1>
      <h2>Participants</h2>

      {Object.entries(grouped).map(([sessionId, group]) => (
        <div key={sessionId} style={{ marginBottom: '1.5rem' }}>
          <h3>Session: {group.sessionName}</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {group.usernames.map((name, idx) => (
              <li key={idx}>- {name}</li>
            ))}
          </ul>
        </div>
      ))}

      <hr style={{ margin: '2rem 0' }} />

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter Value for Funnelling"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          style={{ padding: '0.5rem', width: '300px' }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          {loadingFunnelling ? 'Loading...' : 'Search'}
        </button>
      </div>

      {funnellingData && (
        <div style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '600px', marginInline: 'auto' }}>
          <h2>Funnelling Result</h2>
          <pre style={{
            background: '#f4f4f4',
            padding: '1rem',
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(funnellingData, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
