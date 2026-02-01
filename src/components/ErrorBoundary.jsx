import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console (or send to logging backend)
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (typeof window !== 'undefined') {
      try {
        // Lightweight telemetry hook (no-op if not implemented)
        window.dispatchEvent(new CustomEvent('app:error', { detail: { error, errorInfo } }));
      } catch (_) {}
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    try {
      if (this.props.onReset) this.props.onReset();
    } catch (_) {}
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      if (Fallback) return <Fallback onReset={this.handleReset} error={this.state.error} />;
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 text-center">
            <div className="text-5xl mb-3">🛡️</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">The app hit an unexpected error. You can try again.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={this.handleReset} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">Try again</button>
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
