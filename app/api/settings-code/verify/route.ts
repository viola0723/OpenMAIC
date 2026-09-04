import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { createAccessToken } from '@/lib/server/access-token';

export async function POST(request: Request) {
  const settingsCode = process.env.SETTINGS_CODE;
  if (!settingsCode) {
    return apiSuccess({ valid: true });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  // Constant-time comparison
  if (!body.code) {
    return apiError('INVALID_REQUEST', 401, 'Invalid settings code');
  }
  const encoder = new TextEncoder();
  const a = encoder.encode(body.code);
  const b = encoder.encode(settingsCode);
  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return apiError('INVALID_REQUEST', 401, 'Invalid settings code');
  }

  const token = createAccessToken(settingsCode);
  const cookieStore = await cookies();
  cookieStore.set('openmaic_settings', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });

  return apiSuccess({ valid: true });
}
