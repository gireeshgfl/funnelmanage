export default function DeactivatedAccount() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}>
      <h1 style={{ color: 'red' }}>Oh!!</h1>
      <p style={{ fontSize: '1.2rem' }}>You are out of subscription</p>
    </div>
  );
}
