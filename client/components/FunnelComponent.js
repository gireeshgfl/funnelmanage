export default function FunnelComponent({ participants }) {
    const grouped = participants.reduce((acc, p) => {
      if (!acc[p.sessionId]) {
        acc[p.sessionId] = [];
      }
      acc[p.sessionId].push(p.username);
      return acc;
    }, {});
  
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>Welcome to Funnelling</h1>
        <h2>Participants</h2>
  
        {Object.entries(grouped).map(([sessionId, usernames]) => (
          <div key={sessionId} style={{ marginBottom: '1.5rem' }}>
            <h3>Session: {sessionId}</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {usernames.map((name, idx) => (
                <li key={idx}>- {name}</li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    );
  }
  