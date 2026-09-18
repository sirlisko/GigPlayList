import React, { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="background flex flex-col items-center justify-center min-h-screen text-white text-center p-6">
          <p className="text-2xl mb-4">Something went wrong.</p>
          <Link href="/" className="underline">
            Go back to the homepage
          </Link>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
