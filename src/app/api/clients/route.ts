import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET() {
  if (!verifySession()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch all appointments ordered by date and time
    const appointments = await db.appointment.findMany({
      include: {
        service: true,
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' },
      ],
    });

    // Group appointments by client email to generate client records on-the-fly
    const clientsMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      appointmentsCount: number;
      lastAppointmentDate: string;
      history: typeof appointments;
    }>();

    for (const app of appointments) {
      const emailKey = app.clientEmail.toLowerCase().trim();
      const existing = clientsMap.get(emailKey);

      if (existing) {
        existing.appointmentsCount += 1;
        existing.history.push(app);
        // Since appointments are ordered by date desc, the first one encountered is the latest
      } else {
        clientsMap.set(emailKey, {
          name: app.clientName,
          email: app.clientEmail,
          phone: app.clientPhone,
          appointmentsCount: 1,
          lastAppointmentDate: app.date,
          history: [app],
        });
      }
    }

    const clients = Array.from(clientsMap.values());

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error('Fetch clients error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
