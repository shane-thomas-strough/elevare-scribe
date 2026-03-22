import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Dashboard layout with navigation sidebar.
 * Wraps all dashboard pages with consistent navigation and styling.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps): ReactElement {
  return (
    <div className="min-h-screen bg-es-bg-primary">
      {/* Top Navigation */}
      <header className="border-b border-es-border bg-es-bg-secondary">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-clash text-xl font-bold text-es-text-primary">
              Elevare<span className="text-es-cyan">Scribe</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/tools/stem-separator"
              className="font-inter text-sm text-es-text-secondary hover:text-es-cyan transition-colors"
            >
              Stem Separator
            </Link>
            <Link
              href="/"
              className="font-inter text-sm text-es-text-secondary hover:text-es-cyan transition-colors"
            >
              Back to Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
