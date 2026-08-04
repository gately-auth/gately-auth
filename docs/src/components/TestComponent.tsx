export default function TestComponent() {
  return (
    <div style={{ padding: '2rem', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '1rem' }}>React Component Test</h1>
      <p style={{ color: '#666' }}>If you can see this, React is working!</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
        <strong>Status:</strong> React component rendered successfully ✅
      </div>
    </div>
  );
}
