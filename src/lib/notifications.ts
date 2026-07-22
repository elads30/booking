export interface AppointmentWithService {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  service: {
    name: string;
    price: number;
    duration: number;
  };
}

export async function sendBookingConfirmation(
  appointment: AppointmentWithService
): Promise<void> {
  console.log('\n==================================================');
  console.log('📬 [NOTIFICATION SYSTEM] Email Confirmation');
  console.log(`To Client (${appointment.clientEmail}):`);
  console.log(`  Hi ${appointment.clientName}, your appointment for "${appointment.service.name}" is scheduled for ${appointment.date} at ${appointment.startTime}-${appointment.endTime}.`);
  console.log(`To Business Owner (admin@business.com):`);
  console.log(`  New Booking! ${appointment.clientName} (${appointment.clientPhone}) has booked "${appointment.service.name}" on ${appointment.date} at ${appointment.startTime}.`);
  console.log('==================================================\n');
}

export async function sendStatusChangeNotification(
  appointment: AppointmentWithService,
  newStatus: string
): Promise<void> {
  console.log('\n==================================================');
  console.log('📬 [NOTIFICATION SYSTEM] Email Update');
  console.log(`To Client (${appointment.clientEmail}):`);
  console.log(`  Hi ${appointment.clientName}, your appointment for "${appointment.service.name}" on ${appointment.date} has been updated to: ${newStatus.toUpperCase()}.`);
  console.log('==================================================\n');
}

export async function send24HourReminder(
  appointment: AppointmentWithService
): Promise<void> {
  console.log('\n==================================================');
  console.log('⏰ [NOTIFICATION SYSTEM] 24-Hour Reminder');
  console.log(`To Client (${appointment.clientEmail}):`);
  console.log(`  Reminder: You have an appointment tomorrow: "${appointment.service.name}" on ${appointment.date} at ${appointment.startTime}. We look forward to seeing you!`);
  console.log('==================================================\n');
}

export async function syncToGoogleCalendar(
  appointment: AppointmentWithService
): Promise<string> {
  const mockEventId = `gcal_event_${Math.random().toString(36).substring(2, 11)}`;
  console.log('\n==================================================');
  console.log('📅 [GOOGLE CALENDAR SYNC] Syncing Event...');
  console.log(`Google API Payload:`);
  console.log(`  Summary: ${appointment.service.name} - ${appointment.clientName}`);
  console.log(`  Start Time: ${appointment.date}T${appointment.startTime}:00`);
  console.log(`  End Time: ${appointment.date}T${appointment.endTime}:00`);
  console.log(`  Description: Client Phone: ${appointment.clientPhone}. Notes: ${appointment.notes || 'None'}`);
  console.log(`Status: Success! Event synced. Event ID: ${mockEventId}`);
  console.log('==================================================\n');
  return mockEventId;
}

export async function deleteFromGoogleCalendar(
  googleCalendarEventId: string
): Promise<void> {
  console.log('\n==================================================');
  console.log('📅 [GOOGLE CALENDAR SYNC] Deleting Event...');
  console.log(`Event ID: ${googleCalendarEventId}`);
  console.log(`Status: Success! Event removed from Google Calendar.`);
  console.log('==================================================\n');
}
