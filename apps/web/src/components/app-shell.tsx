import Link from 'next/link';
import type { ReactNode } from 'react';
import { primaryRoutes } from '../config/routes';
import { SessionStatus } from './session-status';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="shell-container shell-topbar">
          <Link className="brand" href="/" aria-label="HX home">
            <span className="brand-mark" aria-hidden="true">HX</span>
            <span>HX Web</span>
          </Link>
          <nav className="nav" aria-label="Primary navigation">
            {primaryRoutes.map((route) => (
              <Link key={route.href} href={route.href}>
                {route.label}
              </Link>
            ))}
          </nav>
          <div className="shell-actions" aria-label="Session shortcuts">
            <SessionStatus />
            <Link className="shell-action" href="/support">Alerts</Link>
            <Link className="shell-action" href="/cart">Cart</Link>
          </div>
        </div>
      </header>
      <main className="shell-main">
        <div className="shell-container">{children}</div>
      </main>
      <footer className="shell-footer">
        <div className="shell-container">
          Browser shell foundation. Production truth must come from BFF read/projection contracts.
        </div>
      </footer>
    </div>
  );
}
