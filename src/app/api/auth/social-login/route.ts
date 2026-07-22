export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL || 'eladush.cohen@gmail.com';

    if (email === adminEmail) {
      // Create session cookie for the admin
      createSession();
      return NextResponse.json({ success: true, message: 'Authenticated successfully' });
    }

    return NextResponse.json(
      { success: false, message: 'Access denied. Only the owner account can access the admin dashboard.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Social login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
