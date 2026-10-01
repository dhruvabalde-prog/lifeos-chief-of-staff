import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthURL, getRedirectUri } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  const redirectUri = getRedirectUri(request);
  const authUrl = getGoogleOAuthURL(redirectUri);
  return NextResponse.redirect(authUrl);
}

