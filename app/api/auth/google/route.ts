import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const authUrl = getGoogleOAuthURL(redirectUri);
  return NextResponse.redirect(authUrl);
}
