import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleTasks, fetchGoogleCalendarEvents, fetchGmailMessages } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('google_access_token')?.value;

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Google Account not authenticated. Click "Connect Google" to sync live data.',
      connected: false,
    }, { status: 401 });
  }

  const results: {
    tasks?: any[];
    calendarEvents?: any[];
    emails?: any[];
    errors: string[];
  } = { errors: [] };

  // Fetch Tasks
  try {
    results.tasks = await fetchGoogleTasks(token);
  } catch (err: unknown) {
    results.errors.push(err instanceof Error ? err.message : 'Tasks fetch failed');
  }

  // Fetch Calendar Events
  try {
    results.calendarEvents = await fetchGoogleCalendarEvents(token);
  } catch (err: unknown) {
    results.errors.push(err instanceof Error ? err.message : 'Calendar fetch failed');
  }

  // Fetch Emails
  try {
    results.emails = await fetchGmailMessages(token);
  } catch (err: unknown) {
    results.errors.push(err instanceof Error ? err.message : 'Gmail fetch failed');
  }

  return NextResponse.json({
    success: true,
    connected: true,
    syncedAt: new Date().toISOString(),
    data: results,
  });
}
