import React from 'react';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
