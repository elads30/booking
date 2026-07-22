'use client';

import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  status: string; // "pending" | "confirmed" | "cancelled" | "rejected"
  notes: string | null;
  service: Service;
}

export default function AppointmentsBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(''); // Default: empty (show all)
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Reschedule Form states
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
        
        // Calculate stats
        const pending = data.appointments.filter((a: Appointment) => a.status === 'pending').length;
        const confirmed = data.appointments.filter((a: Appointment) => a.status === 'confirmed').length;
        setStats({ total: data.appointments.length, pending, confirmed });
      }
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update Status handler
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local items
        fetchAppointments();
        if (selectedAppointment && selectedAppointment.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  // Reschedule Form Submit handler
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setRescheduleLoading(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rescheduleDate,
          startTime: rescheduleTime,
          status: 'confirmed', // Automatically confirm when rescheduled by admin
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        setIsRescheduling(false);
        setSelectedAppointment(null);
      }
    } catch (err) {
      console.error('Rescheduling failed', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Delete handler
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this appointment?')) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
        setSelectedAppointment(null);
      }
    } catch (err) {
      console.error('Deletion failed', err);
    }
  };

  // Filtering Logic
  const filteredAppointments = appointments.filter((app) => {
    const matchesDate = filterDate ? app.date === filterDate : true;
    const matchesStatus = filterStatus === 'all' ? true : app.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="fade-in">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div
          className="glass-panel"
          style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Bookings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '8px' }}>{stats.total}</div>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            borderLeft: '4px solid var(--pending)',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '8px', color: 'var(--pending)' }}>
            {stats.pending}
          </div>
        </div>
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            borderLeft: '4px solid var(--success)',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Confirmed Sessions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '8px', color: 'var(--success)' }}>
            {stats.confirmed}
          </div>
        </div>
      </div>

      {/* Control Panel (Filters) */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field"
              style={{ width: '200px', padding: '8px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
              style={{ width: '160px', padding: '8px 12px' }}
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {(filterDate || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setFilterDate('');
              setFilterStatus('all');
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments List Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Loading database records...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            No appointments matched your query.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedAppointment(app);
                  setIsRescheduling(false);
                }}
                className={`booking-item-card ${selectedAppointment?.id === app.id ? 'active' : ''}`}
                style={{
                  padding: '16px 24px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: selectedAppointment?.id === app.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor:
                          app.status === 'confirmed'
                            ? 'var(--success-glow)'
                            : app.status === 'pending'
                            ? 'var(--primary-glow)'
                            : 'var(--border-color)',
                        color:
                          app.status === 'confirmed'
                            ? 'var(--success)'
                            : app.status === 'pending'
                            ? 'var(--primary)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {app.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                      {app.date} | {app.startTime} - {app.endTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '8px' }}>
                    {app.clientName}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {app.service.name} • ${app.service.price} • {app.service.duration} mins
                  </p>
                </div>

                {/* Micro Buttons Quick Actions */}
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'var(--success)' }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {app.status !== 'cancelled' && app.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal Side Panel / Center Card Overlay */}
      {selectedAppointment && (
        <div
          onClick={() => setSelectedAppointment(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel scale-in"
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '30px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Session Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            {!isRescheduling ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Client Name</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedAppointment.clientName}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Phone</label>
                      <div>{selectedAppointment.clientPhone}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Email</label>
                      <div style={{ wordBreak: 'break-all' }}>{selectedAppointment.clientEmail}</div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Scheduled Time</label>
                    <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                      📅 {selectedAppointment.date} at 🕒 {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Service</label>
                    <div>{selectedAppointment.service.name} (${selectedAppointment.service.price} • {selectedAppointment.service.duration} min)</div>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Client Notes</label>
                      <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        &quot;{selectedAppointment.notes}&quot;
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor:
                            selectedAppointment.status === 'confirmed'
                              ? 'var(--success-glow)'
                              : selectedAppointment.status === 'pending'
                              ? 'var(--primary-glow)'
                              : 'var(--border-color)',
                          color:
                            selectedAppointment.status === 'confirmed'
                              ? 'var(--success)'
                              : selectedAppointment.status === 'pending'
                              ? 'var(--primary)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {selectedAppointment.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedAppointment.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                      className="btn btn-primary"
                      style={{ flex: '1', background: 'var(--success)' }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRescheduleDate(selectedAppointment.date);
                      setRescheduleTime(selectedAppointment.startTime);
                      setIsRescheduling(true);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: '1' }}
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    className="btn btn-danger"
                    style={{ padding: '12px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    New Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    New Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={rescheduleLoading}
                    className="btn btn-primary"
                    style={{ flex: '1' }}
                  >
                    {rescheduleLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
