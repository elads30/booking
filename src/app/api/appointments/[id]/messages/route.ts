export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET: Fetch all messages for a specific appointment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const messages = await db.chatMessage.findMany({
      where: { appointmentId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: unknown) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { sender, message } = await request.json();

    if (!sender || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing sender or message' },
        { status: 400 }
      );
    }

    // Security: Only allow admin to send as admin if verified
    if (sender === 'admin' && !verifySession()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id },
    });
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Save message to database
    const chatMessage = await db.chatMessage.create({
      data: {
        appointmentId: id,
        sender,
        message,
      },
    });

    return NextResponse.json({ success: true, chatMessage });
  } catch (error: unknown) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
