import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a BlockNote/TipTap DOM cleanup error
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('The node to be removed is not a child')
    ) {
      // Don't show error UI for these harmless cleanup errors
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Suppress BlockNote/TipTap DOM cleanup errors
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('The node to be removed is not a child')
    ) {
      // Silently ignore these errors - they're harmless
      return;
    }
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
