export interface ICSInput {
  id: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description?: string;
}

// Helper to format date/time into ICS format YYYYMMDDTHHMMSS
function formatICSDatetime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, ''); // "2026-07-25" -> "20260725"
  const cleanTime = timeStr.replace(/:/g, '') + '00'; // "10:00" -> "100000"
  return `${cleanDate}T${cleanTime}`;
}

export function generateICS(input: ICSInput): string {
  const dtStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z'; // UTC timestamp
  
  const dtStart = formatICSDatetime(input.date, input.startTime);
  const dtEnd = formatICSDatetime(input.date, input.endTime);

  const cleanDescription = (input.description || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appointment Booking App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.id}@appointment-booking-app.local`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${input.serviceName} - Appointment`,
    `DESCRIPTION:${cleanDescription || 'Your scheduled appointment.'}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
