import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getRedirectUri } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const redirectUri = getRedirectUri(request);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const returnBase = isLocal
    ? `http://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '') : `https://${host}`);

  if (error || !code) {
    return NextResponse.redirect(`${returnBase}?google_error=${encodeURIComponent(error || 'Missing authorization code')}`);
  }


  try {
    const tokenData = await exchangeCodeForTokens(code, redirectUri);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';

    // Fetch user profile info
    let userEmail = '';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        userEmail = userData.email || '';
      }
    } catch {
      // Non-blocking
    }

    const response = NextResponse.redirect(
      `${returnBase}?google_connected=true&google_email=${encodeURIComponent(userEmail)}&access_token=${encodeURIComponent(accessToken)}`
    );

    // Set secure cookie for server-side route usage
    response.cookies.set('google_access_token', accessToken, {
      path: '/',
      httpOnly: false,
      secure: returnBase.startsWith('https'),
      maxAge: 3600,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token exchange error';
    return NextResponse.redirect(`${returnBase}?google_error=${encodeURIComponent(msg)}`);
  }
}

