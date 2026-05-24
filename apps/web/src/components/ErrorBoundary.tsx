'use client';

import Link from 'next/link';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import locale from '@/locales/sv.json';

type ErrorBoundaryProps = Readonly<{
  children: ReactNode;
  title?: string;
  message?: string;
  homeLabel?: string;
}>;

type ErrorBoundaryState = Readonly<{
  hasError: boolean;
  error?: Error;
  details?: string;
}>;

const translations = locale.errorBoundary;
const unknownErrorLabel = locale.labels.unknownError;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      details: `${error.message}\n${errorInfo.componentStack ?? ''}`
    });
  }

  private reset() {
    this.setState({ hasError: false, error: undefined, details: undefined });
  }

  public render(): ReactNode {
    const { children, title, message, homeLabel } = this.props;

    if (!this.state.hasError) {
      return children;
    }

    const titleText = title ?? translations.title;
    const messageText = message ?? translations.message;
    const retryLabel = locale.errorBoundary.retryLabel;
    const homeLabelText = homeLabel ?? translations.homeLabel;

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-xl border border-red-200 bg-white p-6 text-sm text-zinc-700">
        <h1 className="text-xl font-semibold text-zinc-900">{titleText}</h1>
        <p>{messageText}</p>
        <p className="text-xs text-zinc-500">{translations.detailsLabel}</p>
        <pre className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
          {this.state.error?.message ?? unknownErrorLabel}
          {this.state.details ? `\n${this.state.details}` : ''}
        </pre>
        <div className="flex gap-3">
          <button
            className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              this.reset();
              window.location.reload();
            }}
            type="button"
          >
            {retryLabel}
          </button>
          <Link className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900" href="/">
            {homeLabelText}
          </Link>
        </div>
      </div>
    );
  }
}
