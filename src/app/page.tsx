'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import BookingCalendar from '@/components/BookingCalendar';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function ClientBookingPortal() {
  const router = useRouter();

  // Wizard Steps state
  const [step, setStep] = useState(1);

  // Data states
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

  // Load saved client info from localStorage on mount and check query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const adminParam = params.get('admin');

      // If owner visits with special URL parameter, flag the browser as admin and redirect
      if (emailParam === 'eladush.cohen@gmail.com' || adminParam === 'true') {
        localStorage.setItem('client_email', 'eladush.cohen@gmail.com');
        localStorage.setItem('is_admin_browser', 'true');
        router.push('/login');
        return;
      }

      const savedEmail = localStorage.getItem('client_email') || '';
      const isAdminBrowser = localStorage.getItem('is_admin_browser') === 'true';
      
      // Auto-redirect if the admin's email or admin flag is stored in this browser
      if (savedEmail === 'eladush.cohen@gmail.com' || isAdminBrowser) {
        router.push('/login');
        return;
      }

      const savedName = localStorage.getItem('client_name') || '';
      const savedPhone = localStorage.getItem('client_phone') || '';
      setClientInfo((prev) => ({
        ...prev,
        name: savedName,
        email: savedEmail,
        phone: savedPhone,
      }));
    }
  }, [router]);

  // UI state
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Submit appointment
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;

    // Basic validation
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
        // Save user details to localStorage
        localStorage.setItem('client_name', clientInfo.name);
        localStorage.setItem('client_email', clientInfo.email);
        localStorage.setItem('client_phone', clientInfo.phone);

        // Redirect to confirmation page
        router.push(`/confirmation/${data.appointment.id}`);
      } else {
        setErrorMessage(data.message || 'Booking failed. The time slot might have been taken.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit booking error:', err);
      setErrorMessage('An error occurred. Please try again.');
      setSubmitting(false);
    }
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
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Therapist intro banner */}
        <div
          className="fade-in"
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '10px',
              background: 'linear-gradient(135deg, var(--text-primary), var(--primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Book Your Session
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
            Choose a service, select an available date and time, and lock in your session in seconds.
          </p>
        </div>

        {/* Wizard Card Container */}
        <div
          className="glass-panel scale-in"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          {/* Progress Indicator */}
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '10px',
              }}
            >
              <span>Step {step} of 4</span>
              <span>{Math.round(progressPercent)}% Completed</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  borderRadius: '3px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              ></div>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              className="fade-in"
              style={{
                backgroundColor: 'var(--danger-glow)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                fontSize: '0.95rem',
                fontWeight: '500',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px' }}>
                Select a Service
              </h2>
              {loadingServices ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Loading services...
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
                        borderRadius: 'var(--radius-md)',
                        border: selectedService?.id === service.id
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                        backgroundColor: selectedService?.id === service.id
                          ? 'var(--primary-glow)'
                          : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '4px' }}>
                          {service.name}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                          {service.description || 'No description available.'}
                        </p>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginTop: '10px',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                          }}
                        >
                          {/* Clock Icon */}
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: '4px' }}
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {service.duration} mins
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                          ${service.price}
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
            <div className="fade-in" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', textAlign: 'left' }}>
                Choose a Date
              </h2>
              <BookingCalendar selectedDate={selectedDate} onSelectDate={(date) => {
                setSelectedDate(date);
                setErrorMessage('');
              }} />
              {selectedDate && (
                <p style={{ marginTop: '16px', fontWeight: '600', color: 'var(--primary)' }}>
                  Selected Date: {selectedDate}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Select Time */}
          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px' }}>
                Select an Available Time Slot
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Available hours for {selectedDate}:
              </p>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  Calculating slots in real time...
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  No available slots on this day. Please go back and choose another date.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '12px',
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

          {/* STEP 4: Personal Information */}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={clientInfo.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={clientInfo.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={clientInfo.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="050-1234567"
                  />
                </div>
              </div>

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '32px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
            }}
          >
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="btn btn-secondary" disabled={submitting}>
                Back
              </button>
            ) : (
              <div></div>
            )}
            {step < 4 && (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Continue
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Global CSS Hover Styles */}
      <style jsx global>{`
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .service-card.active {
          box-shadow: 0 4px 12px 0 var(--primary-glow);
        }
        .time-chip:hover:not(.selected) {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          background-color: var(--primary-glow) !important;
          transform: translateY(-1px);
        }
        .time-chip.selected {
          box-shadow: 0 3px 8px 0 var(--primary-glow) !important;
        }
      `}</style>
    </div>
  );
}
