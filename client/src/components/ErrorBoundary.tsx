import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error) {
    console.error('ErrorBoundary caught', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {this.state.message ?? 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}