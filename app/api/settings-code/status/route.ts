import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/server/api-response';
import { verifyAccessToken } from '@/lib/server/access-token';

export async function GET() {
  const settingsCode = process.env.SETTINGS_CODE;
  const enabled = !!settingsCode;

  let authenticated = false;
  if (enabled) {
    const cookieStore = await cookies();
    const token = cookieStore.get('openmaic_settings')?.value;
    authenticated = !!token && verifyAccessToken(token, settingsCode);
  }

  return apiSuccess({ enabled, authenticated });
}
