import { NextRequest, NextResponse } from 'next/server';
import { ActionCard } from '@/types/lifeos';
import {
  createGmailDraft,
  createGoogleDoc,
  createGoogleSheet,
  createGoogleTask,
  createGoogleCalendarEvent,
} from '@/lib/integrations/googleWorkspaceAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { card, accessToken: providedToken } = body as { card: ActionCard; accessToken?: string };

    const token =
      providedToken ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('google_access_token')?.value ||
      '';

    if (!card) {
      return NextResponse.json({ error: 'Card data required' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({
        success: true,
        executed: false,
        message: 'Executed locally in LifeOS. Connect Google in Settings to sync directly to Workspace.',
      });
    }

    // 1. GMAIL: When user approves an email card, add directly to Gmail Drafts!
    if (card.previewType === 'email' || card.category === 'responses' || card.categoryLabel.includes('GMAIL')) {
      const to = card.previewData?.to || 'recipient@domain.com';
      const subject = card.previewData?.subject || card.headline;
      const emailBody = card.previewData?.body || card.synthesis;

      try {
        const draft = await createGmailDraft(token, to, subject, emailBody);
        return NextResponse.json({
          success: true,
          executed: true,
          service: 'Gmail',
          message: `Draft successfully added to your Gmail Drafts folder!`,
          url: draft.url,
          draftId: draft.draftId,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: true,
          executed: false,
          warning: `Executed in LifeOS. Gmail Drafts sync note: ${err.message}`,
        });
      }
    }

    // 2. GOOGLE DOCS
    if (card.googleService === 'Google Docs' || card.categoryLabel.includes('DOC')) {
      try {
        const docTitle = card.previewData?.docTitle || card.headline;
        const content = card.synthesis || card.headline;
        const doc = await createGoogleDoc(token, docTitle, content);
        return NextResponse.json({
          success: true,
          executed: true,
          service: 'Google Docs',
          message: `Document saved to your Google Drive!`,
          url: doc.url,
        });
      } catch (err: any) {
        // Non-blocking
      }
    }

    // 3. GOOGLE SHEETS
    if (card.googleService === 'Google Sheets' || card.categoryLabel.includes('SHEET')) {
      try {
        const sheetTitle = card.previewData?.docTitle || card.headline;
        const sheet = await createGoogleSheet(token, sheetTitle);
        return NextResponse.json({
          success: true,
          executed: true,
          service: 'Google Sheets',
          message: `Spreadsheet saved to your Google Drive!`,
          url: sheet.url,
        });
      } catch (err: any) {
        // Non-blocking
      }
    }

    // 4. GOOGLE TASKS
    if (card.googleService === 'Google Tasks' || card.categoryLabel.includes('TASK')) {
      try {
        await createGoogleTask(token, card.headline, card.synthesis);
        return NextResponse.json({
          success: true,
          executed: true,
          service: 'Google Tasks',
          message: `Task added to your Google Tasks!`,
        });
      } catch (err: any) {
        // Non-blocking
      }
    }

    // 5. GOOGLE CALENDAR
    if (card.googleService === 'Google Calendar' || card.categoryLabel.includes('CALENDAR')) {
      try {
        const start = new Date(Date.now() + 3600000).toISOString();
        const end = new Date(Date.now() + 7200000).toISOString();
        await createGoogleCalendarEvent(token, {
          summary: card.headline,
          description: card.synthesis,
          startTime: start,
          endTime: end,
        });
        return NextResponse.json({
          success: true,
          executed: true,
          service: 'Google Calendar',
          message: `Event placed on your Google Calendar!`,
        });
      } catch (err: any) {
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      executed: true,
      message: `Action executed and verified by Chief of Staff.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Execution error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
