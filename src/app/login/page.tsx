'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In states
  const [password, setPassword] = useState('');
  
  // Sign Up states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Handle Passcode Sign In (Admin / User)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // If logged in successfully via passcode, check if it was admin passcode
        if (password === 'Ec305010') {
          localStorage.setItem('client_email', 'eladush.cohen@gmail.com');
          localStorage.setItem('is_admin_browser', 'true');
          router.push('/admin');
        } else {
          router.push('/admin');
        }
      } else {
        setError(data.message || 'Invalid passcode.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle Client / User Sign Up
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!signupName || !signupEmail || !signupPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Save client details to localStorage to "remember" them in the app
      localStorage.setItem('client_name', signupName);
      localStorage.setItem('client_email', signupEmail);
      localStorage.setItem('client_phone', 'N/A');
      
      // If client signs up with the admin email, flag them as admin
      if (signupEmail === 'eladush.cohen@gmail.com') {
        localStorage.setItem('is_admin_browser', 'true');
      } else {
        localStorage.setItem('is_admin_browser', 'false');
      }

      setSuccessMsg('Account created successfully! Redirecting you to the portal...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account.');
      setLoading(false);
    }
  };

  // Handle Google / Social Logins
  const handleSocialLogin = async (email: string) => {
    setLoading(true);
    setError('');
    setShowGoogleModal(false);

    try {
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('client_email', email);
        localStorage.setItem('is_admin_browser', 'true');
        router.push('/admin');
      } else {
        setError(data.message || 'Access denied.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Social login error:', err);
      setError('Failed to authenticate via Google.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}
    >
      <div
        className="glass-panel scale-in"
        style={{
          maxWidth: '400px',
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Onboarding Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 15px var(--primary-glow)',
            }}
          ></div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
            AutoFlow Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'signin' ? 'Sign in to access your dashboard' : 'Create an account to book sessions'}
          </p>
        </div>

        {/* Tab Switcher (Sign In / Sign Up) */}
        <div
          style={{
            display: 'flex',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signin' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'signin' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="fade-in"
            style={{
              backgroundColor: 'var(--danger-glow)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            className="fade-in"
            style={{
              backgroundColor: 'var(--success-glow)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* MODE: SIGN IN */}
        {mode === 'signin' && (
          <>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Passcode
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '24px 0',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.5px',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 12px' }}>Or continue with</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Social Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {/* Google */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="btn btn-secondary"
                style={{
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                }}
                title="Sign in with Google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => setError('Apple Sign-In is only available on production devices.')}
                className="btn btn-secondary"
                style={{
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                }}
                title="Sign in with Apple"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.31.12.87 0 1.94-.57 2.5-1.45z"/>
                </svg>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => setError('GitHub Sign-In is only available for development team members.')}
                className="btn btn-secondary"
                style={{
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                }}
                title="Sign in with GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* MODE: SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="input-field"
                placeholder="Elad Cohen"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="input-field"
                placeholder="eladush.cohen@gmail.com"
              />
            </div>



            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      {/* Google Account Selector Mock Modal */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            className="scale-in"
            style={{
              maxWidth: '380px',
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-xl)',
              fontFamily: 'Roboto, sans-serif',
              textAlign: 'center',
            }}
          >
            {/* Google Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="74" height="24" viewBox="0 0 74 24" fill="currentColor">
                <path d="M11.64 5.3C8.67 5.3 5.86 7.7 5.86 12s2.8 6.7 5.78 6.7c3 0 5.8-2.4 5.8-6.7s-2.8-6.7-5.8-6.7zm0 10.8c-1.68 0-3.13-1.4-3.13-4.1 0-2.75 1.45-4.15 3.13-4.15s3.13 1.4 3.13 4.15c0 2.7-1.45 4.1-3.13 4.1zm12.36-10.8c-2.97 0-5.78 2.4-5.78 6.7s2.8 6.7 5.78 6.7c3 0 5.8-2.4 5.8-6.7s-2.8-6.7-5.8-6.7zm0 10.8c-1.68 0-3.13-1.4-3.13-4.1 0-2.75 1.45-4.15 3.13-4.15s3.13 1.4 3.13 4.15c0 2.7-1.45 4.1-3.13 4.1zm12.36-10.5v1.27h.05c.5-.6 1.45-1.27 2.86-1.27 2.95 0 5.4 2.54 5.4 6.7s-2.45 6.7-5.4 6.7c-1.4 0-2.36-.67-2.86-1.32h-.05v1.07c0 2.25-1.2 3.45-3.13 3.45-1.58 0-2.58-1.12-2.93-2.07l-1.11.45c.32.78 1.18 1.83 2.76 1.83 2.92 0 4.39-1.72 4.39-4.83V5.6h-1.32zm.28 7.3c0 2.75-1.4 4.1-3.04 4.1-1.6 0-2.95-1.35-2.95-4.1s1.35-4.15 2.95-4.15c1.64 0 3.04 1.4 3.04 4.15zM50 1.25V23h2.64V1.25H50zm12.82 4.05c-2.7 0-4.95 2.1-4.95 6.7s2.25 6.7 5.15 6.7c2.3 0 3.65-1.4 4.45-2.6l-1.08-.7c-.35.5-.95 1.25-1.98 1.25-1.32 0-2.1-1.02-2.43-1.95L67 13.9l-.33-.85c-.53-1.4-2.1-4.05-5.05-4.05zm-.2 2.15c1 0 1.78.5 2.05 1.23l-4.9 2.02c-.03-2.15 1.5-3.25 2.85-3.25zM6 18.57V5.55H2.43V3.4h5.95v15.17H6z" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Sign in with Google
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              to continue to AutoFlow
            </p>

            {/* Account Selector Area */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', textAlign: 'left', marginBottom: '24px' }}>
              {/* Account 1: Owner */}
              <button
                type="button"
                onClick={() => handleSocialLogin('eladush.cohen@gmail.com')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                  }}
                >
                  E
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Elad Cohen</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>eladush.cohen@gmail.com</div>
                </div>
              </button>

              {/* Account 2: Mock guest */}
              <button
                type="button"
                onClick={() => setError('Access denied. Only the owner account can access the admin dashboard.')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--text-muted)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                  }}
                >
                  G
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Use another account</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log in with a different Google account</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ThemeToggle />
    </div>
  );
}
