import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateICS } from '@/lib/ics';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      return new NextResponse('Appointment not found', { status: 404 });
    }

    const icsContent = generateICS({
      id: appointment.id,
      serviceName: appointment.service.name,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      description: `Appointment for ${appointment.clientName}. Notes: ${appointment.notes || 'None'}`,
    });

    // Return as downloadable file attachment
    const headers = new Headers();
    headers.set('Content-Type', 'text/calendar; charset=utf-8');
    headers.set(
      'Content-Disposition',
      `attachment; filename="appointment-${appointment.date}-${appointment.startTime.replace(
        ':',
        ''
      )}.ics"`
    );

    return new NextResponse(icsContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('ICS generation error:', error);
    return new NextResponse('Failed to generate calendar file', { status: 500 });
  }
}
