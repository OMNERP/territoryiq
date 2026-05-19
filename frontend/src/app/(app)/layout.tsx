'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/index';
import { useSocket } from '@/hooks/useSocket';
import { useGpsTracking } from '@/hooks/useGps';
import { cn } from '@/lib/utils';

const NAV = [
  {
    section: 'Analytics',
    items: [
      { href: '/dashboard',  icon: '⊞',  label: 'Dashboard' },
      { href: '/territory',  icon: '🗺',  label: 'Territory Map' },
      { href: '/coverage',   icon: '◎',  label: 'Coverage Intel' },
    ],
  },
  {
    section: 'Field Ops',
    items: [
      { href: '/mrs',        icon: '👥',  label: 'Medical Reps',    badge: 'live' },
      { href: '/visits',     icon: '📍',  label: 'Visit Tracking' },
      { href: '/routes',     icon: '🧭',  label: 'Route Planner' },
      { href: '/dar',        icon: '📋',  label: 'Daily Reports' },
    ],
  },
  {
    section: 'CRM',
    items: [
      { href: '/doctors',    icon: '⚕️',  label: 'Doctors' },
      { href: '/customers',  icon: '🏪',  label: 'Customers' },
      { href: '/products',   icon: '💊',  label: 'Products' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { href: '/analytics',  icon: '📊',  label: 'Analytics' },
      { href: '/alerts',     icon: '🔔',  label: 'Alerts',         badge: 'alerts' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loadMe, logout }  = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const pathname = usePathname();
  const router   = useRouter();

  useSocket();
  useGpsTracking(true);

  useEffect(() => {
    if (!user) {
      loadMe().catch(() => router.push('/login'));
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    sales_manager: 'Sales Manager',
    regional_manager: 'Regional Manager',
    medical_representative: 'Medical Rep',
    marketing_manager: 'Marketing Manager',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col bg-bg-2 border-r border-white/[0.06] transition-all duration-200 flex-shrink-0 z-30',
          sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden md:w-14'
        )}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-2 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
            🗺
          </div>
          {sidebarOpen && (
            <span className="ml-2.5 font-display text-[15px] font-bold whitespace-nowrap">
              Territory<span className="text-accent">IQ</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((section) => (
            <div key={section.section} className="mb-2">
              {sidebarOpen && (
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-text-3 px-2 py-2">
                  {section.section}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13.5px] font-[450] transition-all duration-150 group',
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-2 hover:bg-bg-4 hover:text-text'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="text-base w-5 flex-shrink-0 text-center">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge === 'live' && (
                          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse-dot" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium truncate">{user.fullName || user.email}</p>
              <p className="text-[11px] text-text-3">{roleLabel[user.role] || user.role}</p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={() => logout()} className="text-text-3 hover:text-text transition-colors" title="Sign out">
              ⏻
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[60px] bg-bg-2 border-b border-white/[0.06] flex items-center px-5 gap-4 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="text-text-3 hover:text-text transition-colors text-lg"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full ml-auto">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse-dot" />
            Live
          </div>

          {/* Alerts bell */}
          <Link href="/alerts" className="relative text-text-3 hover:text-text transition-colors text-lg">
            🔔
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full" />
          </Link>

          {/* Mobile user */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-xs font-bold">
              {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-bg p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
