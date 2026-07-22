'use client';

import { useState, useEffect } from 'react';

interface BookingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

interface BusinessDaySettings {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export default function BookingCalendar({ selectedDate, onSelectDate }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settings, setSettings] = useState<BusinessDaySettings[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch business settings to know which days are closed
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch settings', err);
        setLoading(false);
      });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to check if a specific date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Helper to check if a day of the week is closed based on business hours
  const isClosedDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    const daySetting = settings.find((s) => s.dayOfWeek === dayOfWeek);
    return daySetting ? !daySetting.isOpen : false;
  };

  // Get days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  // Get day of the week the 1st day of month starts on
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Months list
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate to previous month
  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 1, 1);
    const today = new Date();
    // Prevent navigating to past months
    if (prevDate.getMonth() < today.getMonth() && prevDate.getFullYear() === today.getFullYear()) {
      return;
    }
    setCurrentDate(prevDate);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarCells = [];

  // Empty cells for alignment before the first day of the month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Actual day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;
    
    const isPast = isPastDate(date);
    const isClosed = isClosedDay(date);
    const isDisabled = isPast || isClosed;
    const isSelected = selectedDate === dateStr;

    calendarCells.push(
      <button
        key={`day-${day}`}
        type="button"
        disabled={isDisabled}
        onClick={() => onSelectDate(dateStr)}
        className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
        style={{
          aspectRatio: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          borderRadius: '50%',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: isSelected ? '700' : '500',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
          color: isSelected
            ? '#ffffff'
            : isDisabled
            ? 'var(--text-muted)'
            : 'var(--text-primary)',
          opacity: isDisabled ? 0.35 : 1,
        }}
      >
        {day}
        {isClosed && !isPast && (
          <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '2px' }}>
            Closed
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="calendar-container glass-panel fade-in"
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Calendar Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {months[month]} {year}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            disabled={month === new Date().getMonth() && year === new Date().getFullYear()}
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Weekday Names (Sunday: S, Monday: M, etc.) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
        }}
      >
        <div>Su</div>
        <div>Mo</div>
        <div>Tu</div>
        <div>We</div>
        <div>Th</div>
        <div>Fr</div>
        <div>Sa</div>
      </div>

      {/* Days Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          Loading calendar settings...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            justifyItems: 'center',
          }}
        >
          {calendarCells}
        </div>
      )}

      {/* Style Overrides for Hover Effects */}
      <style jsx global>{`
        .calendar-day:not(.disabled):not(.selected):hover {
          background-color: var(--primary-glow) !important;
          color: var(--primary) !important;
          transform: scale(1.1);
        }
        .calendar-day.selected {
          box-shadow: 0 4px 10px 0 var(--primary-glow) !important;
        }
      `}</style>
    </div>
  );
}
