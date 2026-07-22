import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import {
  sendStatusChangeNotification,
  deleteFromGoogleCalendar,
  syncToGoogleCalendar,
} from '@/lib/notifications';

// Helper to check authentication
function checkAuth() {
  return verifySession();
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const { status, date, startTime, notes } = await request.json();

    // 1. Fetch current appointment
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (date || startTime) {
      updateData.date = date || appointment.date;
      updateData.startTime = startTime || appointment.startTime;

      // Recalculate endTime if startTime or date changed
      const timeToUse = startTime || appointment.startTime;
      const [hours, minutes] = timeToUse.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + appointment.service.duration;
      
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      updateData.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    // 3. Update in DB
    const updated = await db.appointment.update({
      where: { id },
      data: updateData,
      include: { service: true },
    });

    // 4. Update Google Calendar or send notifications based on status change
    if (status && status !== appointment.status) {
      await sendStatusChangeNotification(updated, status);

      if (['cancelled', 'rejected'].includes(status) && updated.googleCalendarEventId) {
        // Remove from Google Calendar if cancelled or rejected
        await deleteFromGoogleCalendar(updated.googleCalendarEventId);
        await db.appointment.update({
          where: { id },
          data: { googleCalendarEventId: null },
        });
        updated.googleCalendarEventId = null;
      }
    }

    // If date/time changed and it is still active, sync update to Google Calendar
    if ((date || startTime) && !['cancelled', 'rejected'].includes(updated.status)) {
      if (updated.googleCalendarEventId) {
        await deleteFromGoogleCalendar(updated.googleCalendarEventId);
      }
      const newEventId = await syncToGoogleCalendar(updated);
      await db.appointment.update({
        where: { id },
        data: { googleCalendarEventId: newEventId },
      });
      updated.googleCalendarEventId = newEventId;
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!checkAuth()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const appointment = await db.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    // 1. Delete from Google Calendar if synced
    if (appointment.googleCalendarEventId) {
      await deleteFromGoogleCalendar(appointment.googleCalendarEventId);
    }

    // 2. Delete from DB
    await db.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete appointment' }, { status: 500 });
  }
}
