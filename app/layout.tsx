import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verde Tech V3 Command Center',
  description: 'Cyberpunk IoT irrigation dashboard powered by Supabase.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
