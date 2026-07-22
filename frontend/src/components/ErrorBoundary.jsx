import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #050508)',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          padding: '24px',
          textAlign: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '3rem' }}>🔴</div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
            Page Render Error
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', maxWidth: '480px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred rendering this page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #22d3a0, #3b82f6)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
