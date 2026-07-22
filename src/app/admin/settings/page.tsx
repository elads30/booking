'use client';

import { useState, useEffect } from 'react';

interface BusinessHours {
  id: string;
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  breaks: string; // JSON string of { startTime, endTime }[]
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

export default function BusinessSettings() {
  // Settings states
  const [settings, setSettings] = useState<BusinessHours[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Services states
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // New Service Form states
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [newServicePrice, setNewServicePrice] = useState('100');
  const [creatingService, setCreatingService] = useState(false);

  // Status banners
  const [settingsMessage, setSettingsMessage] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchData = async () => {
    // Fetch Business settings
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
      setLoadingSettings(false);
    } catch (err) {
      console.error(err);
      setLoadingSettings(false);
    }

    // Fetch Services
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
      setLoadingServices(false);
    } catch (err) {
      console.error(err);
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update specific day parameters in state
  const handleDayToggle = (index: number) => {
    const updated = [...settings];
    updated[index].isOpen = !updated[index].isOpen;
    setSettings(updated);
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...settings];
    updated[index][field] = value;
    setSettings(updated);
  };

  // Add a break to a day
  const handleAddBreak = (dayIndex: number) => {
    const updated = [...settings];
    let breaksArr = [];
    try {
      breaksArr = JSON.parse(updated[dayIndex].breaks || '[]');
    } catch (e) {}

    // Add a default break from 13:00 to 14:00
    breaksArr.push({ startTime: '13:00', endTime: '14:00' });
    updated[dayIndex].breaks = JSON.stringify(breaksArr);
    setSettings(updated);
  };

  // Remove a break from a day
  const handleRemoveBreak = (dayIndex: number, breakIndex: number) => {
    const updated = [...settings];
    let breaksArr = [];
    try {
      breaksArr = JSON.parse(updated[dayIndex].breaks || '[]');
    } catch (e) {}

    breaksArr.splice(breakIndex, 1);
    updated[dayIndex].breaks = JSON.stringify(breaksArr);
    setSettings(updated);
  };

  // Edit break hours
  const handleBreakTimeChange = (
    dayIndex: number,
    breakIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updated = [...settings];
    let breaksArr = [];
    try {
      breaksArr = JSON.parse(updated[dayIndex].breaks || '[]');
    } catch (e) {}

    breaksArr[breakIndex][field] = value;
    updated[dayIndex].breaks = JSON.stringify(breaksArr);
    setSettings(updated);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMessage('Business hours saved successfully!');
        setSettings(data.settings);
      } else {
        setSettingsMessage('Failed to save business hours.');
      }
    } catch (err) {
      console.error(err);
      setSettingsMessage('An error occurred while saving.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Create Service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingService(true);
    setServiceMessage('');

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDescription,
          duration: newServiceDuration,
          price: newServicePrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServiceMessage('Service added successfully!');
        setServices((prev) => [...prev, data.service].sort((a, b) => a.name.localeCompare(b.name)));
        setNewServiceName('');
        setNewServiceDescription('');
      } else {
        setServiceMessage('Failed to add service.');
      }
    } catch (err) {
      console.error(err);
      setServiceMessage('An error occurred while saving service.');
    } finally {
      setCreatingService(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' }} className="fade-in">
      
      {/* Business Hours Settings Card */}
      <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px' }}>Business Hours & Breaks</h3>

        {settingsMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-glow)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
          >
            {settingsMessage}
          </div>
        )}

        {loadingSettings ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Retrieving settings records...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {settings.map((day, idx) => {
              let breaksArr: { startTime: string; endTime: string }[] = [];
              try {
                breaksArr = JSON.parse(day.breaks || '[]');
              } catch (e) {}

              return (
                <div
                  key={day.id}
                  style={{
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Day name and isOpen toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '180px' }}>
                      <input
                        type="checkbox"
                        id={`isOpen-${day.id}`}
                        checked={day.isOpen}
                        onChange={() => handleDayToggle(idx)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label
                        htmlFor={`isOpen-${day.id}`}
                        style={{ fontSize: '1rem', fontWeight: '700', cursor: 'pointer', opacity: day.isOpen ? 1 : 0.5 }}
                      >
                        {dayNames[day.dayOfWeek]}
                      </label>
                    </div>

                    {/* Opening Times */}
                    {day.isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                          className="input-field"
                          style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                          className="input-field"
                          style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Closed</span>
                    )}

                    {/* Add Break Button */}
                    {day.isOpen && (
                      <button
                        type="button"
                        onClick={() => handleAddBreak(idx)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        + Add Break
                      </button>
                    )}
                  </div>

                  {/* Render Breaks List for this Day */}
                  {day.isOpen && breaksArr.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingLeft: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {breaksArr.map((brk, brkIdx) => (
                        <div
                          key={brkIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Break:</span>
                          <input
                            type="time"
                            value={brk.startTime}
                            onChange={(e) =>
                              handleBreakTimeChange(idx, brkIdx, 'startTime', e.target.value)
                            }
                            className="input-field"
                            style={{ width: '90px', padding: '4px 8px', fontSize: '0.8rem' }}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={brk.endTime}
                            onChange={(e) =>
                              handleBreakTimeChange(idx, brkIdx, 'endTime', e.target.value)
                            }
                            className="input-field"
                            style={{ width: '90px', padding: '4px 8px', fontSize: '0.8rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBreak(idx, brkIdx)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1.2rem',
                              marginLeft: '8px',
                            }}
                            title="Remove break"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            >
              {savingSettings ? 'Saving Settings...' : 'Save Settings Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Services List and Create Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Add Service Card */}
        <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px' }}>Add New Service</h3>

          {serviceMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--success-glow)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}
            >
              {serviceMessage}
            </div>
          )}

          <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Service Name
              </label>
              <input
                type="text"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="input-field"
                placeholder="e.g. Couples Therapy"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
                className="input-field"
                placeholder="Briefly describe what this service involves..."
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Duration (mins)
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="480"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingService}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            >
              {creatingService ? 'Creating...' : '+ Create Service'}
            </button>
          </form>
        </div>

        {/* Current Services List */}
        <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px' }}>Active Services</h3>
          
          {loadingServices ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Querying services...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{service.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      🕒 {service.duration} mins • ${service.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
