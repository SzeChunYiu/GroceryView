import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import '../styles/header.css';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'GroceryView',
  description: 'Stockholm grocery price intelligence for products, stores, and weekly baskets.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            <Header />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
