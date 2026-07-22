export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// Public GET: Fetch all available services
export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Fetch services error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// Admin POST: Add a new service
export async function POST(request: Request) {
  if (!verifySession()) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { name, description, duration, price } = await request.json();

    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newService = await db.service.create({
      data: {
        name,
        description,
        duration: parseInt(duration),
        price: parseFloat(price),
      },
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create service' },
      { status: 500 }
    );
  }
}
