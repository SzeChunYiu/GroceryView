import type { Metadata } from 'next';
import { Providers } from './providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'GroceryView',
  description: 'Stockholm grocery price intelligence for products, stores, and weekly baskets.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>
            <div className="flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
