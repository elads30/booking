import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-at-least-32-chars-long';

function signValue(value: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(value);
  const signature = hmac.digest('hex');
  return `${value}.${signature}`;
}

function verifyValue(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [value, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(value)
    .digest('hex');
  if (signature === expectedSignature) return value;
  return null;
}

export function createSession() {
  const token = signValue('admin');
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export function verifySession(): boolean {
  const cookie = cookies().get(SESSION_COOKIE_NAME);
  if (!cookie) return false;
  const value = verifyValue(cookie.value);
  return value === 'admin';
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
