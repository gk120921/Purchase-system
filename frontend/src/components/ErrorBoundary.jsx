import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>系統發生錯誤 (System Error)</h2>
          <p style={{ color: '#64748b', margin: '1rem 0' }}>請嘗試重新整理頁面，若問題持續請聯絡資訊小組。</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', maxWidth: '80%', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#00205B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            重新整理頁面 (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
