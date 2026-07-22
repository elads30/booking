export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

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
    const { clientName, clientPhone, clientEmail, serviceId, date, startTime, notes, paymentMethod, whatTheyWant } =
      await request.json();

    if (!clientName || !clientEmail || !date || !startTime || !paymentMethod || !whatTheyWant) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch service to get duration and name
    let service = null;
    let finalServiceId = serviceId;

    if (serviceId && serviceId !== 'custom') {
      service = await db.service.findUnique({
        where: { id: serviceId },
      });
    }

    // Fallback if no service is found or if it is a custom text entry
    if (!service) {
      const firstService = await db.service.findFirst();
      if (firstService) {
        service = firstService;
        finalServiceId = firstService.id;
      } else {
        // Auto-create a default service record so foreign key constraint is satisfied
        service = await db.service.create({
          data: {
            name: 'Custom Session',
            description: 'Custom booking request',
            duration: 60,
            price: 0,
          },
        });
        finalServiceId = service.id;
      }
    }

    // 2. Safe calculation of end time for custom text inputs
    let endTime = '';
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const startMinutes = hours * 60 + (minutes || 0);
        const endMinutes = startMinutes + service.duration;
        const endHours = Math.floor(endMinutes / 60) % 24;
        const endMins = endMinutes % 60;
        endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      } else {
        endTime = startTime; // If they wrote custom text like "Afternoon"
      }
    } catch {
      endTime = startTime;
    }

    // 3. Create appointment in database (removed double-booking check to support open-ended date/time text entries)
    const appointment = await db.appointment.create({
      data: {
        clientName,
        clientPhone: clientPhone || 'N/A',
        clientEmail,
        serviceId: finalServiceId,
        date,
        startTime,
        endTime,
        status: 'pending',
        notes,
        paymentMethod,
        whatTheyWant,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating appointment' },
      { status: 500 }
    );
  }
}
