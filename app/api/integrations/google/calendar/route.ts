import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('google_access_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Google Account not authenticated.' }, { status: 401 });
    }

    const events = await fetchGoogleCalendarEvents(token);
    return NextResponse.json({ success: true, events });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch Google Calendar Events';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, description, startTime, endTime } = body;

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('google_access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Google Account not connected.' },
        { status: 401 }
      );
    }

    const event = await createGoogleCalendarEvent(token, {
      summary,
      description,
      startTime,
      endTime,
    });

    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create Google Calendar Event';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
