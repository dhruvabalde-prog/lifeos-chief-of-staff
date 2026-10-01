import { NextRequest, NextResponse } from 'next/server';
import { createGoogleTask, fetchGoogleTasks } from '@/lib/integrations/googleOAuth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('google_access_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Google Account not authenticated.' }, { status: 401 });
    }

    const tasks = await fetchGoogleTasks(token);
    return NextResponse.json({ success: true, tasks });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch Google Tasks';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, notes, accessToken } = body;

    const token = accessToken || request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('google_access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Google Account not connected. Click "Connect Google" to authenticate.' },
        { status: 401 }
      );
    }

    const task = await createGoogleTask(token, title, notes);
    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create Google Task';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
