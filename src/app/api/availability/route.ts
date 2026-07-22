import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/calendar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!date || !serviceId) {
      return NextResponse.json(
        { success: false, message: 'Missing date or serviceId query parameters' },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format, must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(date, serviceId);
    return NextResponse.json({ success: true, slots });
  } catch (error: unknown) {
    console.error('Fetch availability error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch availability';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
