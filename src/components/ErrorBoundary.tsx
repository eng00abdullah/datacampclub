import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-navy flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8 relative">
            <div className="absolute inset-0 bg-destructive/10 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-6">
              <h1 className="text-6xl font-black font-cyber text-destructive tracking-tighter">CRITICAL_FAILURE</h1>
              <div className="p-6 glass border-destructive/20 rounded-2xl bg-destructive/5 space-y-4">
                <p className="text-sm font-mono text-destructive uppercase tracking-widest leading-relaxed">
                  The system has encountered an unexpected recursive loop or memory corruption in the grid interface.
                </p>
                {this.state.error && (
                  <pre className="text-[10px] text-muted-foreground bg-black/40 p-4 rounded text-left overflow-auto max-h-40 border border-white/5">
                    {this.state.error.message}
                  </pre>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="cyber" 
                  onClick={() => window.location.reload()}
                >
                  REBOOT_SYSTEM
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  ABORT_TO_HOME
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
