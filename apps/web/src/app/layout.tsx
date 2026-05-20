<<<<<<< HEAD
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'GroceryView',
  description: 'Stockholm grocery price intelligence for products, stores, and weekly baskets.'
=======
import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GroceryView",
  description: "Chart-first grocery price terminal with transparent price provenance.",
>>>>>>> ec0cb15 (fix: restore release validation gate)
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
<<<<<<< HEAD
        <Providers>{children}</Providers>
=======
        <Providers>
          <AppNav />
          {children}
        </Providers>
>>>>>>> ec0cb15 (fix: restore release validation gate)
      </body>
    </html>
  );
}
