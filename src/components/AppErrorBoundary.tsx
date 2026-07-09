import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";

type Props = {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <AppErrorFallback message={this.state.error.message} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}
