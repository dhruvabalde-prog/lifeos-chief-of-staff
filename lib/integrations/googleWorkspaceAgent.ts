/**
 * Google Workspace Agentic API Services
 * Real execution for Google Docs, Sheets, Slides, Tasks, Calendar, Gmail Drafts & Drive
 */

export interface AgentDocResult {
  id: string;
  title: string;
  url: string;
  action: 'created' | 'edited' | 'deleted' | 'read';
  contentSnippet?: string;
}

export interface AgentSheetResult {
  id: string;
  title: string;
  url: string;
  action: 'created' | 'edited' | 'deleted';
}

export interface AgentSlideResult {
  id: string;
  title: string;
  url: string;
  action: 'created' | 'deleted';
}

export interface AgentDraftResult {
  draftId: string;
  to: string;
  subject: string;
  bodySnippet: string;
  url: string;
}

/**
 * 1. GOOGLE DOCS AGENT OPERATIONS
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialContent?: string
): Promise<AgentDocResult> {
  // 1. Create document
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error(`Google Docs create failed: ${await res.text()}`);
  }

  const doc = await res.json();
  const documentId = doc.documentId;
  const url = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Insert initial content if provided
  if (initialContent && initialContent.trim()) {
    try {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `${initialContent}\n\n[Created via LifeOS Executive Chief of Staff]`,
              },
            },
          ],
        }),
      });
    } catch {
      // Non-fatal
    }
  }

  return {
    id: documentId,
    title,
    url,
    action: 'created',
    contentSnippet: initialContent?.slice(0, 150),
  };
}

export async function editGoogleDoc(
  accessToken: string,
  documentId: string,
  textToAppend: string
): Promise<AgentDocResult> {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text: `\n\n${textToAppend}`,
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Docs edit failed: ${await res.text()}`);
  }

  return {
    id: documentId,
    title: 'Updated Document',
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    action: 'edited',
    contentSnippet: textToAppend.slice(0, 150),
  };
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Google Drive delete file failed: ${await res.text()}`);
  }
  return true;
}

/**
 * 2. GOOGLE SHEETS AGENT OPERATIONS
 */
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  rowsData?: (string | number)[][]
): Promise<AgentSheetResult> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Sheets create failed: ${await res.text()}`);
  }

  const sheet = await res.json();
  const spreadsheetId = sheet.spreadsheetId;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Insert rows data if provided
  if (rowsData && rowsData.length > 0) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: 'Sheet1!A1',
            majorDimension: 'ROWS',
            values: rowsData,
          }),
        }
      );
    } catch {
      // Non-fatal
    }
  }

  return {
    id: spreadsheetId,
    title,
    url,
    action: 'created',
  };
}

export async function editGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<AgentSheetResult> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Sheets edit failed: ${await res.text()}`);
  }

  return {
    id: spreadsheetId,
    title: 'Updated Sheet',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    action: 'edited',
  };
}

/**
 * 3. GOOGLE SLIDES AGENT OPERATIONS
 */
export async function createGooglePresentation(
  accessToken: string,
  title: string
): Promise<AgentSlideResult> {
  const res = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error(`Google Slides create failed: ${await res.text()}`);
  }

  const slide = await res.json();
  const presentationId = slide.presentationId;
  const url = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return {
    id: presentationId,
    title,
    url,
    action: 'created',
  };
}

/**
 * 4. GOOGLE TASKS AGENT OPERATIONS
 */
export async function createGoogleTask(
  accessToken: string,
  title: string,
  notes?: string,
  due?: string
) {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes: notes || 'Created via LifeOS Chief of Staff',
      due: due || undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Tasks create failed: ${await res.text()}`);
  }
  return res.json();
}

export async function editGoogleTask(
  accessToken: string,
  taskId: string,
  updates: { title?: string; notes?: string; status?: 'needsAction' | 'completed' }
) {
  const cleanId = taskId.replace(/^gtask-/, '');
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${cleanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error(`Google Tasks edit failed: ${await res.text()}`);
  }
  return res.json();
}

export async function deleteGoogleTask(accessToken: string, taskId: string): Promise<boolean> {
  const cleanId = taskId.replace(/^gtask-/, '');
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${cleanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Google Tasks delete failed: ${await res.text()}`);
  }
  return true;
}

/**
 * 5. GOOGLE CALENDAR AGENT OPERATIONS
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
  }
) {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description || 'Created via LifeOS Chief of Staff',
      location: event.location,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar create event failed: ${await res.text()}`);
  }
  return res.json();
}

export async function editGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  const cleanId = eventId.replace(/^gcal-/, '');
  const body: any = {};
  if (updates.summary) body.summary = updates.summary;
  if (updates.description) body.description = updates.description;
  if (updates.startTime) body.start = { dateTime: updates.startTime };
  if (updates.endTime) body.end = { dateTime: updates.endTime };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${cleanId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar edit event failed: ${await res.text()}`);
  }
  return res.json();
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  const cleanId = eventId.replace(/^gcal-/, '');
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${cleanId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Google Calendar delete event failed: ${await res.text()}`);
  }
  return true;
}

/**
 * 6. GMAIL AGENT DRAFTS & REPLIES
 */
function createMimeMessage(to: string, subject: string, bodyText: string): string {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText,
  ];

  const rawMessage = emailLines.join('\r\n');
  return Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createGmailDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<AgentDraftResult> {
  const raw = createMimeMessage(to, subject, body);

  const payload: any = {
    message: {
      raw,
    },
  };
  if (threadId) {
    payload.message.threadId = threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Gmail create draft failed: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    draftId: data.id,
    to,
    subject,
    bodySnippet: body.slice(0, 150),
    url: 'https://mail.google.com/mail/u/0/#drafts',
  };
}

export async function sendGmailDraft(accessToken: string, draftId: string) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: draftId }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send draft failed: ${await res.text()}`);
  }
  return res.json();
}
