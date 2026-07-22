'use client';

import { useState, useEffect } from 'react';

interface Service {
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  service: Service;
}

interface Client {
  name: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  lastAppointmentDate: string;
  history: Appointment[];
}

export default function ClientDatabase() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClients(data.clients);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch clients error:', err);
        setLoading(false);
      });
  }, []);

  // Translate status helper
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'ממתין לאישור';
      case 'confirmed': return 'מאושר';
      case 'cancelled': return 'בוטל';
      case 'rejected': return 'נדחה';
      default: return status;
    }
  };

  // Search Filter
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="fade-in">
      {/* Search and Filters Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)',
          textAlign: 'right',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '8px',
            color: 'var(--text-secondary)',
          }}
        >
          חיפוש לקוחות במאגר
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            placeholder="חפש לפי שם, אימייל או טלפון..."
            style={{ maxWidth: '400px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary"
              style={{ padding: '10px 16px' }}
            >
              נקה
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout (List + Detail Pane) */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1.2fr 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
        {/* Clients Directory */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)', textAlign: 'right' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>
            רשימת לקוחות ({filteredClients.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              טוען רשומות לקוחות ממסד הנתונים...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              לא נמצאו לקוחות רשומים.
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 16px' }}>שם הלקוח</th>
                    <th style={{ padding: '12px 16px' }}>פרטי התקשרות</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>תורים שנקבעו</th>
                    <th style={{ padding: '12px 16px' }}>תור אחרון</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr
                      key={client.email}
                      onClick={() => setSelectedClient(client)}
                      className={`client-row ${selectedClient?.email === client.email ? 'active' : ''}`}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontSize: '0.95rem',
                      }}
                    >
                      <td style={{ padding: '16px', fontWeight: '700' }}>{client.name}</td>
                      <td style={{ padding: '16px' }}>
                        <div>{client.email}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{client.phone}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>
                        {client.appointmentsCount}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                        {client.lastAppointmentDate || 'אין תורים קודמים'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Client Detail History Panel (Side-by-side) */}
        {selectedClient && (
          <div
            className="glass-panel fade-in"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--primary-glow)',
              textAlign: 'right',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>היסטוריית פגישות</h3>
              <button
                onClick={() => setSelectedClient(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                {selectedClient.name}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                ✉ {selectedClient.email} • 📞 {selectedClient.phone}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedClient.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                  אין תורים בהיסטוריה עבור לקוח זה.
                </div>
              ) : (
                selectedClient.history.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          fontSize: '0.7rem',
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
                        {translateStatus(app.status)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {app.date}
                      </span>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{app.service.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      שעה: {app.startTime} - {app.endTime}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .client-row:hover {
          background-color: var(--bg-primary) !important;
        }
        .client-row.active {
          background-color: var(--primary-glow) !important;
        }
      `}</style>
    </div>
  );
}
