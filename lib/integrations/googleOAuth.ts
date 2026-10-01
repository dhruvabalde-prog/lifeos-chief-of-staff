/**
 * Google OAuth 2.0 & Workspace Services
 * Read securely from environment variables
 */

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ');

export function getRedirectUri(request?: { headers: { get: (name: string) => string | null } }): string {
  const host = request?.headers?.get('x-forwarded-host') || request?.headers?.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocal) {
    return `http://${host || 'localhost:3000'}/api/auth/google/callback`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const clean = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '');
    return `${clean}/api/auth/google/callback`;
  }

  if (host) {
    const proto = request?.headers?.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}/api/auth/google/callback`;
  }

  return 'https://lessgo-eta.vercel.app/api/auth/google/callback';
}

export function getGoogleOAuthURL(redirectUri: string): string {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const clientId = GOOGLE_CLIENT_ID || (typeof window !== 'undefined' ? localStorage.getItem('GOOGLE_CLIENT_ID') || '' : '');
  
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google token exchange failed: ${errorData}`);
  }

  return response.json();
}

// Google Tasks API: Fetch Tasks
export async function fetchGoogleTasks(accessToken: string) {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=25', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Google Tasks fetch error: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: `gtask-${item.id}`,
    title: item.title,
    notes: item.notes || '',
    due: item.due,
    status: item.status,
    completed: item.status === 'completed',
  }));
}

// Google Tasks API: Create Real Task
export async function createGoogleTask(accessToken: string, title: string, notes?: string) {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes: notes || 'Created via LifeOS Chief of Staff',
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Tasks API error: ${await res.text()}`);
  }

  return res.json();
}

// Google Calendar API: Fetch Upcoming Events
export async function fetchGoogleCalendarEvents(accessToken: string) {
  const now = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=15`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Google Calendar fetch error: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => {
    const startStr = item.start?.dateTime || item.start?.date || '';
    const endStr = item.end?.dateTime || item.end?.date || '';
    
    let timeRange = 'All Day';
    if (startStr.includes('T')) {
      const s = new Date(startStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const e = endStr.includes('T') ? new Date(endStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      timeRange = e ? `${s} - ${e}` : s;
    }

    return {
      id: `gcal-${item.id}`,
      title: item.summary || 'Untitled Event',
      timeRange,
      countdownMinutes: Math.max(0, Math.round((new Date(startStr).getTime() - Date.now()) / 60000)),
      location: item.location || '',
      meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || undefined,
      isHighImpact: Boolean(item.hangoutLink),
    };
  });
}

// Google Calendar API: Create Event
export async function createGoogleCalendarEvent(accessToken: string, event: {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
}) {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${await res.text()}`);
  }

  return res.json();
}

// Gmail API: Fetch Recent Unread / Priority Messages
export async function fetchGmailMessages(accessToken: string) {
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    throw new Error(`Gmail API error: ${await listRes.text()}`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  const detailedMessages = await Promise.all(
    messages.slice(0, 5).map(async (msg: any) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          return {
            id: detail.id,
            snippet: detail.snippet,
            subject,
            from,
            date,
          };
        }
      } catch {
        return null;
      }
      return null;
    })
  );

  return detailedMessages.filter(Boolean);
}
