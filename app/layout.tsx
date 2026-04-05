import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IM Content System',
  description: 'Infinite Marketing Content Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
