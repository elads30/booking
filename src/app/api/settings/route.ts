export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// Public GET: Fetch all business settings (BusinessHours for Sunday-Saturday)
export async function GET() {
  try {
    const settings = await db.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}

// Admin PUT: Update business settings (BusinessHours)
export async function PUT(request: Request) {
  if (!verifySession()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { settings } = await request.json(); // Array of { id, dayOfWeek, isOpen, startTime, endTime, breaks }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data format, settings array is required' },
        { status: 400 }
      );
    }

    // Update each setting day-by-day
    const updatedSettings = [];
    for (const item of settings) {
      const { id, isOpen, startTime, endTime, breaks } = item;
      
      const updated = await db.businessHours.update({
        where: { id },
        data: {
          isOpen: isOpen !== undefined ? isOpen : true,
          startTime: startTime || '09:00',
          endTime: endTime || '17:00',
          breaks: breaks !== undefined ? (typeof breaks === 'string' ? breaks : JSON.stringify(breaks)) : '[]',
        },
      });
      updatedSettings.push(updated);
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}
