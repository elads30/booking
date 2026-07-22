import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { getAvailableSlots } from '@/lib/calendar';
import { sendBookingConfirmation, syncToGoogleCalendar } from '@/lib/notifications';

// Admin GET: Fetch list of all appointments
export async function GET() {
  if (!verifySession()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const appointments = await db.appointment.findMany({
      include: {
        service: true,
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' },
      ],
    });
    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// Public POST: Create a new appointment
export async function POST(request: Request) {
  try {
    const { clientName, clientPhone, clientEmail, serviceId, date, startTime, notes } =
      await request.json();

    if (!clientName || !clientPhone || !clientEmail || !serviceId || !date || !startTime) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch service to get duration and name
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Selected service does not exist' },
        { status: 404 }
      );
    }

    // 2. Prevent double booking by validating slot availability in real time
    const availableSlots = await getAvailableSlots(date, serviceId);
    const isSlotAvailable = availableSlots.some((s) => s.startTime === startTime);

    if (!isSlotAvailable) {
      return NextResponse.json(
        { success: false, message: 'The selected time slot is no longer available' },
        { status: 409 }
      );
    }

    // 3. Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    // 4. Create appointment in database
    const appointment = await db.appointment.create({
      data: {
        clientName,
        clientPhone,
        clientEmail,
        serviceId,
        date,
        startTime,
        endTime,
        status: 'pending', // Starts as pending, owner manually approves or updates
        notes,
      },
      include: {
        service: true,
      },
    });

    // 5. Trigger notifications (Mock email confirmation)
    await sendBookingConfirmation(appointment);

    // 6. Sync with Google Calendar (Mock sync)
    const googleEventId = await syncToGoogleCalendar(appointment);

    // Save the synced googleEventId to the database
    const updatedAppointment = await db.appointment.update({
      where: { id: appointment.id },
      data: { googleCalendarEventId: googleEventId },
      include: { service: true },
    });

    return NextResponse.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}
