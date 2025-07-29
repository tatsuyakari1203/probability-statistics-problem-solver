import * as React from 'react';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100">
      <main className="w-full max-w-none px-0 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};