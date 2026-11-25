import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Luminary ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121417] text-slate-900 dark:text-slate-100 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-8 text-center space-y-4">
            <h1 className="text-2xl font-serif-custom font-bold">Something went wrong</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We ran into an unexpected display error. Your saved entries remain safe on the server.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-slate-900 dark:bg-amber-600 hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </ErrorBoundary>
);
