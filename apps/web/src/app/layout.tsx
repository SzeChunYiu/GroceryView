import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import '../styles/footer.css';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'GroceryView',
  description: 'Stockholm grocery price intelligence for products, stores, and weekly baskets.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
