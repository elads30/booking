export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// Public GET: Fetch all available services
export async function GET() {
  try {
    let services = await db.service.findMany({
      orderBy: { name: 'asc' },
    });

    // Auto-seed if the database has zero services
    if (services.length === 0) {
      console.log('No services found. Auto-seeding database...');
      
      try {
        await db.service.create({
          data: {
            name: 'Consultation Session',
            description: 'A 30-minute initial consultation to discuss your needs and set goals.',
            duration: 30,
            price: 50.0,
          },
        });

        await db.service.create({
          data: {
            name: 'Standard Therapy Session',
            description: 'A 60-minute standard therapy and alignment session.',
            duration: 60,
            price: 100.0,
          },
        });

        await db.service.create({
          data: {
            name: 'Extended Deep Dive',
            description: 'A 90-minute extended deep-dive session for deep therapeutic work.',
            duration: 90,
            price: 150.0,
          },
        });

        // Check if business hours are also empty and seed them
        const hoursCount = await db.businessHours.count();
        if (hoursCount === 0) {
          const hoursData = [
            { dayOfWeek: 0, isOpen: true, startTime: '10:00', endTime: '15:00', breaks: '[]' },
            { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
            { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
            { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
            { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
            { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '15:00', breaks: '[]' },
            { dayOfWeek: 6, isOpen: false, startTime: '09:00', endTime: '17:00', breaks: '[]' },
          ];
          for (const h of hoursData) {
            await db.businessHours.create({ data: h });
          }
        }

        // Re-fetch services
        services = await db.service.findMany({
          orderBy: { name: 'asc' },
        });
      } catch (seedErr) {
        console.error('Failed to auto-seed database:', seedErr);
      }
    }

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Fetch services error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch services. Make sure your database tables are created.' },
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
