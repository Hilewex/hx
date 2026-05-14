import type { Metadata } from 'next';
import { AppShell } from '../src/components/app-shell';
import { AppProviders } from '../src/providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'HX Web',
  description: 'HX browser-rendered web application shell foundation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
