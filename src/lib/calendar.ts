import { db } from './db';

// Helper to convert "HH:MM" string to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper to convert minutes from midnight to "HH:MM" string
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export interface TimeSlot {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

/**
 * Calculates available time slots for a specific date and service
 * @param dateStr Date in format YYYY-MM-DD
 * @param serviceId ID of the requested service
 */
export async function getAvailableSlots(dateStr: string, serviceId: string): Promise<TimeSlot[]> {
  // 1. Fetch service details
  const service = await db.service.findUnique({
    where: { id: serviceId },
  });
  if (!service) {
    throw new Error('Service not found');
  }

  // 2. Parse date and get day of the week
  // Splitting by '-' to ensure local date interpretation (preventing timezone shifting)
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const dayOfWeek = localDate.getDay(); // 0 is Sunday, 1 is Monday...

  // 3. Fetch business hours for this day of the week
  const businessHours = await db.businessHours.findFirst({
    where: { dayOfWeek },
  });

  if (!businessHours || !businessHours.isOpen) {
    return []; // Business is closed on this day
  }

  const workStart = timeToMinutes(businessHours.startTime);
  const workEnd = timeToMinutes(businessHours.endTime);
  const serviceDuration = service.duration;

  // 4. Parse breaks
  let breaks: { startTime: string; endTime: string }[] = [];
  try {
    breaks = JSON.parse(businessHours.breaks || '[]');
  } catch (e) {
    console.error('Failed to parse breaks JSON', e);
  }
  const parsedBreaks = breaks.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  // 5. Fetch existing booked appointments for this day (exclude cancelled/rejected)
  const appointments = await db.appointment.findMany({
    where: {
      date: dateStr,
      status: {
        in: ['pending', 'confirmed'],
      },
    },
  });

  const bookedIntervals = appointments.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  // 6. Generate all potential slots of 'serviceDuration' length
  const potentialSlots: TimeSlot[] = [];
  
  // Custom slot generation: step by 15-minute intervals (for high flexibility)
  // or step by the duration of the service.
  // Stepping by 30-minute increments gives clients cleaner slots (e.g. 09:00, 09:30, 10:00).
  const slotStep = 30; 

  for (let current = workStart; current + serviceDuration <= workEnd; current += slotStep) {
    const slotStart = current;
    const slotEnd = current + serviceDuration;

    // Check if slot falls within any break
    const overlapsBreak = parsedBreaks.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );
    if (overlapsBreak) continue;

    // Check if slot overlaps with any existing booking
    const overlapsBooking = bookedIntervals.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );
    if (overlapsBooking) continue;

    // If today, filter out past slots
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    if (dateStr === todayStr) {
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      if (slotStart <= currentMinutes + 15) {
        // Add 15-minute buffer from now
        continue;
      }
    }

    potentialSlots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
    });
  }

  return potentialSlots;
}
