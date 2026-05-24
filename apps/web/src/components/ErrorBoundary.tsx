"use client";

import type { Component, ErrorInfo, ReactNode } from "react";
import { Component as ReactComponent } from "react";
import locale from "@/locales/sv.json";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    hasError: false,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      error,
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary captured", error.message, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-4xl rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-700 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">{locale.errors.title}</h2>
          <p className="mt-2">{locale.errors.message}</p>
          <p className="mt-2 text-sm text-zinc-500">{this.state.error?.message || locale.emptyState.message}</p>
          <button
            className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            type="button"
            onClick={this.reset}
          >
            {locale.errors.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
