export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import ThemeToggle from '@/components/ThemeToggle';
import ClientChat from '@/components/ClientChat';

interface ConfirmationPageProps {
  params: {
    id: string;
  };
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = params;

  // Fetch appointment data from database
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: {
      service: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  // Format date for display
  const [year, month, day] = appointment.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        className="glass-panel"
        style={{
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            }}
          ></div>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            AutoFlow
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Confirmation Section */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          className="glass-panel scale-in"
          style={{
            maxWidth: '550px',
            width: '100%',
            borderRadius: 'var(--radius-xl)',
            padding: '40px',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: 'var(--bg-card)',
            textAlign: 'center',
          }}
        >
          {/* Animated Green Checkmark Wrapper */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-glow)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px var(--success-glow)',
            }}
          >
            {/* Success Check Icon */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>
            Your appointment has been registered and is pending approval by the therapist.
          </p>

          {/* Details Card */}
          <div
            style={{
              textAlign: 'left',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Service
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {appointment.service.name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Date
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  {formattedDate}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Time
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                  {appointment.startTime} - {appointment.endTime}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Client Details
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '4px' }}>
                {appointment.clientName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {appointment.clientEmail} | {appointment.clientPhone}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Requested / Sent
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {appointment.whatTheyWant}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                Payment Method
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginTop: '4px' }}>
                {appointment.paymentMethod}
              </div>
            </div>

            {appointment.notes && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Special Notes
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                  &quot;{appointment.notes}&quot;
                </div>
              </div>
            )}
          </div>

          {/* Client-Admin Chat Box */}
          <ClientChat appointmentId={appointment.id} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href={`/api/appointments/${appointment.id}/ics`}
              className="btn btn-primary"
              style={{ padding: '14px' }}
            >
              {/* Calendar Icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Add to Personal Calendar (.ICS)
            </a>

            <Link href="/" className="btn btn-secondary" style={{ padding: '14px' }}>
              Book Another Appointment
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
