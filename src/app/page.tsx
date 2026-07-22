'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function ClientBookingPortal() {
  const router = useRouter();

  // Onboarding & Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In states
  const [signinPassword, setSigninPassword] = useState('');
  
  // Sign Up states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Wizard Steps state
  const [step, setStep] = useState(1);

  // Booking Data states
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client Info states
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: '',
    whatTheyWant: '',
    notes: '',
  });

  // UI state
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check authentication on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('client_email') || '';
      const isAdmin = localStorage.getItem('is_admin_browser') === 'true';

      if (savedEmail) {
        if (savedEmail === 'eladush.cohen@gmail.com' || isAdmin) {
          router.push('/admin');
        } else {
          const savedName = localStorage.getItem('client_name') || '';
          const savedPhone = localStorage.getItem('client_phone') || '';
          setClientInfo((prev) => ({
            ...prev,
            name: savedName,
            email: savedEmail,
            phone: savedPhone,
          }));
          setIsAuthenticated(true);
        }
      }
      setCheckingAuth(false);
    }
  }, [router]);

  // Fetch services on load
  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServices(data.services);
        } else {
          setErrorMessage('Could not load services.');
        }
        setLoadingServices(false);
      })
      .catch((err) => {
        console.error('Fetch services error:', err);
        setErrorMessage('Failed to connect to server.');
        setLoadingServices(false);
      });
  }, []);

  // Fetch available slots when service and date are selected
  useEffect(() => {
    if (selectedService && selectedDate) {
      setLoadingSlots(true);
      setAvailableSlots([]);
      setSelectedTime('');
      setErrorMessage('');

      fetch(`/api/availability?date=${selectedDate}&serviceId=${selectedService.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAvailableSlots(data.slots);
          } else {
            setErrorMessage(data.message || 'Could not fetch time slots.');
          }
          setLoadingSlots(false);
        })
        .catch((err) => {
          console.error('Fetch availability error:', err);
          setErrorMessage('Failed to load slots.');
          setLoadingSlots(false);
        });
    }
  }, [selectedService, selectedDate]);

  // Form input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Sign In submit handler (Passcode)
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: signinPassword }),
      });

      const data = await response.json();

      if (data.success) {
        if (signinPassword === 'Ec305010') {
          localStorage.setItem('client_email', 'eladush.cohen@gmail.com');
          localStorage.setItem('is_admin_browser', 'true');
          router.push('/admin');
        } else {
          router.push('/admin');
        }
      } else {
        setErrorMessage(data.message || 'Invalid passcode.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Sign Up submit handler
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      localStorage.setItem('client_name', signupName);
      localStorage.setItem('client_email', signupEmail);
      localStorage.setItem('client_phone', 'N/A');

      setClientInfo((prev) => ({
        ...prev,
        name: signupName,
        email: signupEmail,
        phone: 'N/A',
      }));

      if (signupEmail === 'eladush.cohen@gmail.com') {
        localStorage.setItem('is_admin_browser', 'true');
        setSuccessMessage('Admin account verified. Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      } else {
        localStorage.setItem('is_admin_browser', 'false');
        setSuccessMessage('Account registered successfully! Loading booking portal...');
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to sign up.');
    }
  };

  // Social Login submit handler
  const handleSocialLogin = async (email: string) => {
    setErrorMessage('');
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
        // If not the owner email, log in as client!
        localStorage.setItem('client_email', email);
        localStorage.setItem('is_admin_browser', 'false');

        const namePart = email.split('@')[0];
        const clientName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        localStorage.setItem('client_name', clientName);
        localStorage.setItem('client_phone', '050-0000000');

        setClientInfo((prev) => ({
          ...prev,
          name: clientName,
          email: email,
          phone: '050-0000000',
        }));

        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Social login failed.');
    }
  };

  // Submit appointment booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;

    if (!clientInfo.name || !clientInfo.phone || !clientInfo.email || !clientInfo.paymentMethod || !clientInfo.whatTheyWant) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientInfo.name,
          clientPhone: clientInfo.phone,
          clientEmail: clientInfo.email,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          notes: clientInfo.notes,
          paymentMethod: clientInfo.paymentMethod,
          whatTheyWant: clientInfo.whatTheyWant,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save latest state
        localStorage.setItem('client_name', clientInfo.name);
        localStorage.setItem('client_email', clientInfo.email);
        localStorage.setItem('client_phone', clientInfo.phone);

        router.push(`/confirmation/${data.appointment.id}`);
      } else {
        setErrorMessage(data.message || 'Booking failed. Time slot might be taken.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit booking error:', err);
      setErrorMessage('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Logout/Reset handler
  const handleLogout = () => {
    localStorage.removeItem('client_name');
    localStorage.removeItem('client_email');
    localStorage.removeItem('client_phone');
    localStorage.removeItem('is_admin_browser');
    setIsAuthenticated(false);
    setStep(1);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setSigninPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  // Wizard navigation helper
  const nextStep = () => {
    if (step === 1 && !selectedService) {
      setErrorMessage('Please select a service to proceed.');
      return;
    }
    if (step === 2 && !selectedDate) {
      setErrorMessage('Please select a date to proceed.');
      return;
    }
    if (step === 3 && !selectedTime) {
      setErrorMessage('Please select a time slot to proceed.');
      return;
    }
    setErrorMessage('');
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMessage('');
    setStep((prev) => prev - 1);
  };

  // Progress Bar Width calculation
  const progressPercent = ((step - 1) / 3) * 100;

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading AutoFlow...
      </div>
    );
  }

  // 1. SHOW ONBOARDING CARD IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
          {/* Header */}
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
              {authMode === 'signin' ? 'Sign in to schedule your bookings' : 'Create an account to continue'}
            </p>
          </div>

          {/* Toggle */}
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
                setAuthMode('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                backgroundColor: authMode === 'signin' ? 'var(--bg-card)' : 'transparent',
                color: authMode === 'signin' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: authMode === 'signin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                backgroundColor: authMode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: authMode === 'signup' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
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
              {errorMessage}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
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
              {successMessage}
            </div>
          )}

          {/* SIGN IN VIEW */}
          {authMode === 'signin' && (
            <>
              <form onSubmit={handlePasscodeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Passcode
                  </label>
                  <input
                    type="password"
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                >
                  {submitting ? 'Authenticating...' : 'Sign In'}
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
                  onClick={() => setErrorMessage('Apple Sign-In is only available on production devices.')}
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
                  onClick={() => setErrorMessage('GitHub Sign-In is only available for development team members.')}
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

          {/* SIGN UP VIEW */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  placeholder=""
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
                  placeholder="@gmail.com"
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
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              >
                Create Account
              </button>
            </form>
          )}
        </div>

        {/* Mock Google Modal */}
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

                {/* Account 2: Guest */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('guest.tester@gmail.com')}
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

  // 2. SHOW BOOKING WIZARD PORTAL IF AUTHENTICATED
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header
        className="glass-panel"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.refresh()}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 0 10px var(--primary-glow)',
            }}
          ></div>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            AutoFlow
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* User Signout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Sign Out ({clientInfo.name})
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero & Wizard Section */}
      <main
        style={{
          flex: 1,
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Wizard Progress Bar */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div
            style={{
              height: '4px',
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '2px',
              position: 'relative',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--primary)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 8px var(--primary-glow)',
              }}
            ></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: step >= 1 ? '700' : '400', color: step >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>1. Service</span>
            <span style={{ fontWeight: step >= 2 ? '700' : '400', color: step >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>2. Date</span>
            <span style={{ fontWeight: step >= 3 ? '700' : '400', color: step >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>3. Time</span>
            <span style={{ fontWeight: step >= 4 ? '700' : '400', color: step >= 4 ? 'var(--text-primary)' : 'var(--text-muted)' }}>4. Details</span>
          </div>
        </div>

        {/* Wizard Content Card */}
        <div
          className="glass-panel scale-in"
          style={{
            padding: '40px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {errorMessage && step !== 4 && (
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
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
                Select a Service
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Please choose the session you would like to book with AutoFlow.
              </p>

              {loadingServices ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Loading services list...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setErrorMessage('');
                      }}
                      className={`service-card ${selectedService?.id === service.id ? 'active' : ''}`}
                      style={{
                        padding: '20px',
                        border: selectedService?.id === service.id
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: selectedService?.id === service.id
                          ? 'var(--primary-glow)'
                          : 'var(--bg-secondary)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                          {service.name}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {service.description || 'Professional consulting session.'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', display: 'block' }}>
                          ${service.price}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ⏱ {service.duration} mins
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Date */}
          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
                Select a Date
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Choose a day for your scheduling slot.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setErrorMessage('');
                  }}
                  className="input-field"
                  style={{ maxWidth: '320px', padding: '14px', fontSize: '1rem', textAlign: 'center' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Select Time Slot */}
          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
                Select a Time
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Showing real-time open windows for {selectedDate}.
              </p>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Checking slot availability...
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--danger)', fontWeight: '500' }}>
                  No available slots on this day. Please pick a different date.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '12px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    padding: '4px',
                  }}
                >
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot.startTime);
                        setErrorMessage('');
                      }}
                      className={`time-chip ${selectedTime === slot.startTime ? 'selected' : ''}`}
                      style={{
                        padding: '12px 8px',
                        border: selectedTime === slot.startTime
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedTime === slot.startTime
                          ? 'var(--primary-glow)'
                          : 'var(--bg-secondary)',
                        color: selectedTime === slot.startTime
                          ? 'var(--primary)'
                          : 'var(--text-primary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Personal Information & Custom Questions */}
          {step === 4 && (
            <form onSubmit={handleBookingSubmit} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
                  Confirm & Fill Details
                </h2>
                {selectedService && selectedDate && selectedTime && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '20px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div><strong>Service:</strong> {selectedService.name} (${selectedService.price})</div>
                    <div><strong>Date & Time:</strong> {selectedDate} at {selectedTime} ({selectedService.duration} mins)</div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div
                  className="fade-in"
                  style={{
                    backgroundColor: 'var(--danger-glow)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Read Only Contact Fields from Account */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Name (From Account)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={clientInfo.name}
                    className="input-field"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Email (From Account)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={clientInfo.email}
                    className="input-field"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Open-Ended Custom Questions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  What do you want to request / send? *
                </label>
                <textarea
                  name="whatTheyWant"
                  required
                  value={clientInfo.whatTheyWant}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Please write in detail what you want to request or send..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  How do you want to pay? *
                </label>
                <input
                  type="text"
                  name="paymentMethod"
                  required
                  value={clientInfo.paymentMethod}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g. Bank transfer, Bit, Credit card..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Special Notes / Additional Comments (Optional)
                </label>
                <textarea
                  name="notes"
                  value={clientInfo.notes}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Any additional details you want to share..."
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              >
                {submitting ? 'Booking Session...' : 'Confirm Appointment Booking'}
              </button>
            </form>
          )}

          {/* Navigation Controls (Back/Next) */}
          {step !== 4 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '32px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '20px',
              }}
            >
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="btn btn-secondary"
                style={{
                  visibility: step === 1 ? 'hidden' : 'visible',
                  padding: '10px 24px',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
                style={{
                  padding: '10px 28px',
                }}
              >
                Next Step
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
