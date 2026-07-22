'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { name: 'Calendar Board', path: '/admin', icon: '📅' },
    { name: 'Client Database', path: '/admin/clients', icon: '👥' },
    { name: 'Business Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside
        className="glass-panel"
        style={{
          width: '280px',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '30px 20px',
          position: 'fixed',
          height: '100vh',
          zIndex: 50,
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        {/* Admin Header Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', paddingLeft: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 0 10px var(--primary-glow)',
            }}
          ></div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            AuraBooking Admin
          </span>
        </div>

        {/* Navigation links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid var(--primary-glow)' : '1px solid transparent',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions inside Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              boxShadow: 'none',
            }}
          >
            🚪 {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header
          style={{
            height: '70px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            backgroundColor: 'var(--bg-secondary)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {pathname === '/admin'
              ? 'Appointments Board'
              : pathname === '/admin/clients'
              ? 'Client Database'
              : 'Business Settings'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Public Portal
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Inner Page View */}
        <main style={{ flex: 1, padding: '40px' }}>{children}</main>
      </div>

      <style jsx global>{`
        .nav-link:hover:not(.active) {
          background-color: var(--border-color) !important;
          color: var(--text-primary) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
