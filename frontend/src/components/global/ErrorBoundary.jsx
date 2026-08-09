import { Component } from 'react';
import { ErrorState } from './ErrorState';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something broke"
          description="This part of the admin panel ran into an unexpected error."
          actionLabel="Reload page"
          onAction={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
