import React from 'react';
import '../ErrorBoundary.css'; // You'll need to create this CSS file

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h1>Oops! Something went wrong.</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.</p>
          {this.state.error && (
            <details className="error-details">
              <summary>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              <p>Component Stack Error Details:</p>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;