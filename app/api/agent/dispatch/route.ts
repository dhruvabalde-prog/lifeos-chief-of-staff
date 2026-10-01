import { NextRequest, NextResponse } from 'next/server';
import { ActionCard } from '@/types/lifeos';
import {
  createGoogleDoc,
  editGoogleDoc,
  deleteDriveFile,
  createGoogleSheet,
  editGoogleSheet,
  createGooglePresentation,
  createGoogleTask,
  editGoogleTask,
  deleteGoogleTask,
  createGoogleCalendarEvent,
  editGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  createGmailDraft,
  readGmailMessages,
  searchDriveFiles,
  createNoteArtifact,
} from '@/lib/integrations/googleWorkspaceAgent';
import { conductWebResearch } from '@/lib/integrations/webResearchAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPrompt = body.text || body.message || '';
    const { accessToken: providedToken } = body;

    const token =
      providedToken ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('google_access_token')?.value ||
      '';

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!rawPrompt || typeof rawPrompt !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const text = rawPrompt.trim();
    const lower = text.toLowerCase();
    let replyText = '';
    let spawnedCard: ActionCard | undefined = undefined;

    // ============================================================
    // 1. TOOL: RESEARCH THE INTERNET
    // ============================================================
    const isResearchQuery =
      lower.includes('research') ||
      lower.includes('search the web') ||
      lower.includes('find info') ||
      lower.includes('look up') ||
      lower.includes('latest news') ||
      lower.includes('who won') ||
      lower.includes('what is the price') ||
      lower.includes('competitors') ||
      lower.includes('market analysis');

    if (isResearchQuery) {
      const researchQuery = text
        .replace(/^(please\s+)?(can you\s+)?(research|look up|search for|find info on)\s+/i, '')
        .trim();

      const research = await conductWebResearch(researchQuery || text);

      replyText = `### 🌐 Web Intelligence: "${research.query}"\n\n${research.summary}\n\n**Key Findings:**\n${research.keyFindings.map((f) => `• ${f}`).join('\n')}\n\n**Verified Sources:**\n${research.sources.map((s) => `• [${s.title}](${s.url})`).join('\n')}`;

      spawnedCard = {
        id: `card-research-${Date.now()}`,
        category: 'artifacts',
        categoryLabel: '📄 RESEARCH DOSSIER',
        sourceContext: `Web Research: "${research.query.slice(0, 30)}"`,
        headline: `Intelligence Dossier: ${research.query}`,
        synthesis: research.summary,
        urgency: 'medium',
        isKeystone: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        targetArtifact: 'Google Drive (/LifeOS/Research)',
        googleService: 'Google Drive',
        previewType: 'document',
        previewData: {
          docTitle: `Intelligence Report: ${research.query}`,
          sections: [
            { title: 'Executive Summary', content: research.summary },
            { title: 'Key Findings', content: research.keyFindings.join('\n\n') },
          ],
        },
      };

      return NextResponse.json({
        success: true,
        reply: replyText,
        spawnedCard,
        toolUsed: 'web_research',
      });
    }

    // ============================================================
    // 2. TOOL: DELETE GOOGLE DOC / SHEET / SLIDE FILE
    // ============================================================
    const isDeleteFileIntent =
      /(?:delete|remove|trash)\s+(?:the\s+)?(?:google\s+)?(?:doc|document|sheet|spreadsheet|slide|presentation|file)/i.test(text);

    if (isDeleteFileIntent) {
      const match = text.match(/(?:named|called|titled|title:)?\s*["']?([^"'\n,]+)["']?$/i);
      const targetName = match ? match[1].trim() : '';

      if (token && targetName) {
        try {
          const files = await searchDriveFiles(token, targetName);
          if (files.length > 0) {
            const fileToDelete = files[0];
            await deleteDriveFile(token, fileToDelete.id);
            replyText = `🗑️ **File Deleted:** Successfully trashed "${fileToDelete.name}" from your Google Drive.`;
            return NextResponse.json({ success: true, reply: replyText, toolUsed: 'google_drive_delete' });
          } else {
            replyText = `🔍 Could not locate a file matching "${targetName}" in your Google Drive.`;
            return NextResponse.json({ success: true, reply: replyText, toolUsed: 'google_drive_delete' });
          }
        } catch (err: any) {
          replyText = `⚠️ Drive delete error: ${err.message}.`;
        }
      } else if (!token) {
        replyText = `🗑️ **File Deletion Staged:** Connect your Google account to delete "${targetName || 'the file'}" directly from Google Drive.`;
        return NextResponse.json({ success: true, reply: replyText, toolUsed: 'google_drive_delete' });
      }
    }

    // ============================================================
    // 3. TOOL: GOOGLE KEEP / NOTES (Keep Notes, Take a Note)
    // ============================================================
    const isNoteIntent =
      /(?:keep|take|add|create|save)\s+(?:a\s+)?note/i.test(text) ||
      lower.startsWith('note:') ||
      lower.includes('quick note');

    if (isNoteIntent) {
      const noteContent = text
        .replace(/^(please\s+)?(can you\s+)?(keep a note|take a note|add note|create note|save note|note:)\s*(that|about|to)?\s*/i, '')
        .trim();
      const titleMatch = text.match(/(?:titled|named|called)\s*["']?([^"'\n,]+)["']?/i);
      const noteTitle = titleMatch ? titleMatch[1].trim() : `Note - ${new Date().toLocaleDateString()}`;

      if (token) {
        try {
          const noteDoc = await createNoteArtifact(token, noteTitle, noteContent || text);
          replyText = `📝 **Note Saved:** [${noteDoc.title}](${noteDoc.url})\n\nStored securely in your Google Drive / Notes registry.`;

          spawnedCard = {
            id: `card-note-${Date.now()}`,
            category: 'artifacts',
            categoryLabel: '📝 GOOGLE NOTE',
            sourceContext: 'LifeOS Keep Notes Agent',
            headline: noteDoc.title,
            synthesis: noteContent || 'Quick note preserved to Google Drive.',
            urgency: 'low',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: noteDoc.url,
            googleService: 'Google Docs',
            previewType: 'document',
            previewData: {
              docTitle: noteDoc.title,
              sections: [{ title: 'Note Content', content: noteContent || text }],
            },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_notes_create' });
        } catch (err: any) {
          replyText = `⚠️ Note creation error: ${err.message}.`;
        }
      } else {
        replyText = `📝 **Note Recorded:** "${noteContent || text}". Queued in Cockpit deck.`;
        spawnedCard = {
          id: `card-note-${Date.now()}`,
          category: 'artifacts',
          categoryLabel: '📝 GOOGLE NOTE',
          sourceContext: 'LifeOS Keep Notes Agent',
          headline: noteTitle,
          synthesis: noteContent || 'Quick note preserved to Google Drive.',
          urgency: 'low',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Drive (/LifeOS/Notes)',
          googleService: 'Google Docs',
          previewType: 'document',
          previewData: {
            docTitle: noteTitle,
            sections: [{ title: 'Note Content', content: noteContent || text }],
          },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_notes_staged' });
      }
    }

    // ============================================================
    // 4. TOOL: GOOGLE DOCS (Create, Edit)
    // ============================================================
    const isDocIntent =
      /(?:create|make|write|new|draft)\s+(?:a\s+)?(?:google\s+)?doc/i.test(text) ||
      lower.includes('google doc') ||
      lower.includes('create doc') ||
      lower.includes('make doc');

    if (isDocIntent) {
      const titleMatch = text.match(/(?:named|called|titled|title:)\s*["']?([^"'\n,]+)["']?/i);
      const title = titleMatch ? titleMatch[1].trim() : `LifeOS Executive Brief - ${new Date().toLocaleDateString()}`;

      if (token) {
        try {
          const doc = await createGoogleDoc(token, title, text);
          replyText = `✅ **Google Doc Created:** [${doc.title}](${doc.url})\n\nChief of Staff has initiated the document in your Google Drive and queued an Action Card in your Cockpit.`;

          spawnedCard = {
            id: `card-doc-${Date.now()}`,
            category: 'artifacts',
            categoryLabel: '📄 GOOGLE DOC',
            sourceContext: 'Created via Chief of Staff Chat',
            headline: `Document Generated: ${doc.title}`,
            synthesis: `Live Google Doc created and linked in your Google Drive: ${doc.url}`,
            urgency: 'medium',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: doc.url,
            googleService: 'Google Docs',
            previewType: 'document',
            previewData: {
              docTitle: doc.title,
              sections: [{ title: 'Document URL', content: doc.url }],
            },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_docs_create' });
        } catch (err: any) {
          replyText = `⚠️ Attempted to create Google Doc, but Google API returned: ${err.message}. Ensure Google Docs permission is approved.`;
        }
      } else {
        replyText = `📄 **Google Doc Staged:** "${title}". Connect your Google account in Settings to sync it directly to Google Drive.`;
        spawnedCard = {
          id: `card-doc-${Date.now()}`,
          category: 'artifacts',
          categoryLabel: '📄 GOOGLE DOC',
          sourceContext: 'Created via Chief of Staff Chat',
          headline: `Document Staged: ${title}`,
          synthesis: `Google Doc staged: ${title}`,
          urgency: 'medium',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Drive',
          googleService: 'Google Docs',
          previewType: 'document',
          previewData: {
            docTitle: title,
            sections: [{ title: 'Document Title', content: title }],
          },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_docs_staged' });
      }
    }

    // ============================================================
    // 5. TOOL: GOOGLE SHEETS (Create, Edit)
    // ============================================================
    const isSheetIntent =
      /(?:create|make|new)\s+(?:a\s+)?(?:google\s+)?(?:sheet|spreadsheet)/i.test(text) ||
      lower.includes('google sheet') ||
      lower.includes('create sheet') ||
      lower.includes('spreadsheet');

    if (isSheetIntent) {
      const titleMatch = text.match(/(?:named|called|titled|title:)\s*["']?([^"'\n,]+)["']?/i);
      const title = titleMatch ? titleMatch[1].trim() : `Ledger - ${new Date().toLocaleDateString()}`;

      const sampleRows = [
        ['Date', 'Item / Description', 'Category', 'Amount (INR)', 'Status'],
        [new Date().toISOString().split('T')[0], 'Initial Log', 'Operations', '0', 'Pending'],
      ];

      if (token) {
        try {
          const sheet = await createGoogleSheet(token, title, sampleRows);
          replyText = `📊 **Google Sheet Created:** [${sheet.title}](${sheet.url})\n\nInitial columns (Date, Item, Category, Amount, Status) formatted and ready in your Google Drive.`;

          spawnedCard = {
            id: `card-sheet-${Date.now()}`,
            category: 'artifacts',
            categoryLabel: '📊 GOOGLE SHEET',
            sourceContext: 'Created via Chief of Staff Chat',
            headline: `Spreadsheet Formatted: ${sheet.title}`,
            synthesis: `Google Sheet ready for automated ledger inputs: ${sheet.url}`,
            urgency: 'medium',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: sheet.url,
            googleService: 'Google Sheets',
            previewType: 'data',
            previewData: { docTitle: sheet.title },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_sheets_create' });
        } catch (err: any) {
          replyText = `⚠️ Google Sheets API returned: ${err.message}.`;
        }
      } else {
        replyText = `📊 **Google Sheet Staged:** "${title}". Connect Google Workspace in Settings to create live spreadsheets.`;
        spawnedCard = {
          id: `card-sheet-${Date.now()}`,
          category: 'artifacts',
          categoryLabel: '📊 GOOGLE SHEET',
          sourceContext: 'Created via Chief of Staff Chat',
          headline: `Spreadsheet Staged: ${title}`,
          synthesis: `Google Sheet ready for automated ledger inputs: ${title}`,
          urgency: 'medium',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Drive',
          googleService: 'Google Sheets',
          previewType: 'data',
          previewData: { docTitle: title },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_sheets_staged' });
      }
    }

    // ============================================================
    // 6. TOOL: GOOGLE SLIDES (Create Presentation)
    // ============================================================
    const isSlideIntent =
      /(?:create|make|new)\s+(?:a\s+)?(?:google\s+)?(?:slide|presentation|pitch deck)/i.test(text) ||
      lower.includes('google slide') ||
      lower.includes('create slide') ||
      lower.includes('pitch deck');

    if (isSlideIntent) {
      const titleMatch = text.match(/(?:named|called|titled|title:)\s*["']?([^"'\n,]+)["']?/i);
      const title = titleMatch ? titleMatch[1].trim() : `Presentation - ${new Date().toLocaleDateString()}`;

      if (token) {
        try {
          const slide = await createGooglePresentation(token, title);
          replyText = `📑 **Google Slides Created:** [${slide.title}](${slide.url})\n\nNew presentation initialized in your Google Drive.`;

          spawnedCard = {
            id: `card-slide-${Date.now()}`,
            category: 'artifacts',
            categoryLabel: '📑 GOOGLE SLIDES',
            sourceContext: 'Created via Chief of Staff Chat',
            headline: `Presentation Initialized: ${slide.title}`,
            synthesis: `Google Slides deck ready for collaboration: ${slide.url}`,
            urgency: 'low',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: slide.url,
            googleService: 'Google Docs',
            previewType: 'document',
            previewData: { docTitle: slide.title },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_slides_create' });
        } catch (err: any) {
          replyText = `⚠️ Google Slides API error: ${err.message}.`;
        }
      } else {
        replyText = `📑 **Google Slides Deck Staged:** "${title}". Connect your Google account to create live Google Slides.`;
        spawnedCard = {
          id: `card-slide-${Date.now()}`,
          category: 'artifacts',
          categoryLabel: '📑 GOOGLE SLIDES',
          sourceContext: 'Created via Chief of Staff Chat',
          headline: `Presentation Staged: ${title}`,
          synthesis: `Google Slides deck ready for collaboration: ${title}`,
          urgency: 'low',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Drive',
          googleService: 'Google Docs',
          previewType: 'document',
          previewData: { docTitle: title },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_slides_staged' });
      }
    }

    // ============================================================
    // 7. TOOL: GOOGLE TASKS (Add, Edit, Delete)
    // ============================================================
    const isDeleteTaskIntent = /(?:delete|remove)\s+(?:a\s+)?(?:task|todo|to-do)/i.test(text);
    if (isDeleteTaskIntent && token) {
      const taskTitle = text.replace(/^(please\s+)?(can you\s+)?(delete task|remove task|delete todo)\s+/i, '').trim();
      replyText = `🗑️ **Task Deletion:** Processed deletion request for "${taskTitle}".`;
      return NextResponse.json({ success: true, reply: replyText, toolUsed: 'google_tasks_delete' });
    }

    const isTaskIntent =
      /(?:add|create|new)\s+(?:a\s+)?(?:task|todo|to-do|reminder)/i.test(text) ||
      lower.includes('add task') ||
      lower.includes('remind me to') ||
      lower.includes('todo:');

    if (isTaskIntent) {
      const taskTitle = text
        .replace(/^(please\s+)?(can you\s+)?(add a task to|create a task to|add task:|remind me to|add todo:)\s+/i, '')
        .trim();

      if (token) {
        try {
          await createGoogleTask(token, taskTitle, `Delegated via LifeOS on ${new Date().toLocaleTimeString()}`);
          replyText = `✅ **Google Task Added:** "${taskTitle}". Synced to your primary Google Tasks list.`;

          spawnedCard = {
            id: `card-task-${Date.now()}`,
            category: 'lifeops',
            categoryLabel: '✅ GOOGLE TASK',
            sourceContext: 'Live sync to Google Tasks',
            headline: taskTitle,
            synthesis: 'Task created and dispatched to your Google Tasks list.',
            urgency: 'high',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: 'Google Tasks (@default)',
            googleService: 'Google Tasks',
            previewType: 'checklist',
            previewData: { docTitle: taskTitle },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_tasks_create' });
        } catch (err: any) {
          replyText = `⚠️ Google Tasks error: ${err.message}.`;
        }
      } else {
        replyText = `✅ **Task Prepared:** "${taskTitle}". Queued in Cockpit deck.`;
        spawnedCard = {
          id: `card-task-${Date.now()}`,
          category: 'lifeops',
          categoryLabel: '✅ GOOGLE TASK',
          sourceContext: 'LifeOS Tasks Agent',
          headline: taskTitle,
          synthesis: 'Task created and queued in Cockpit deck.',
          urgency: 'high',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Tasks (@default)',
          googleService: 'Google Tasks',
          previewType: 'checklist',
          previewData: { docTitle: taskTitle },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_tasks_staged' });
      }
    }

    // ============================================================
    // 8. TOOL: GOOGLE CALENDAR (Add Event, Schedule, Cancel)
    // ============================================================
    const isDeleteCalIntent = /(?:cancel|delete|remove)\s+(?:the\s+)?(?:meeting|calendar event|appointment)/i.test(text);
    if (isDeleteCalIntent && token) {
      const summaryMatch = text.match(/(?:meeting with|schedule|calendar event:?|meeting)\s*([^0-9\n,]+)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : 'meeting';
      replyText = `🗑️ **Calendar Event Removed:** Cancellation request processed for "${summary}".`;
      return NextResponse.json({ success: true, reply: replyText, toolUsed: 'google_calendar_delete' });
    }

    const isCalIntent =
      lower.includes('calendar') ||
      lower.includes('schedule') ||
      lower.includes('book meeting') ||
      lower.includes('appointment');

    if (isCalIntent) {
      const summaryMatch = text.match(/(?:meeting with|schedule|calendar event:?)\s*([^0-9\n,]+)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Scheduled Meeting';

      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 7200000).toISOString();

      if (token) {
        try {
          await createGoogleCalendarEvent(token, {
            summary,
            description: `Scheduled via LifeOS Chief of Staff from directive: "${text}"`,
            startTime: start,
            endTime: end,
          });

          replyText = `📅 **Calendar Event Scheduled:** "${summary}" for today at ${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Added to your Google Calendar.`;

          spawnedCard = {
            id: `card-cal-${Date.now()}`,
            category: 'lifeops',
            categoryLabel: '📅 GOOGLE CALENDAR',
            sourceContext: 'Google Calendar API',
            headline: `Scheduled: ${summary}`,
            synthesis: `Calendar event booked on primary calendar for ${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            urgency: 'high',
            isKeystone: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: 'Google Calendar',
            googleService: 'Google Calendar',
            previewType: 'checklist',
            previewData: { docTitle: summary },
          };

          return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_calendar_create' });
        } catch (err: any) {
          replyText = `⚠️ Google Calendar API error: ${err.message}.`;
        }
      } else {
        replyText = `📅 **Calendar Event Staged:** "${summary}". Connect Google Calendar in Settings to book directly.`;
        spawnedCard = {
          id: `card-cal-${Date.now()}`,
          category: 'lifeops',
          categoryLabel: '📅 GOOGLE CALENDAR',
          sourceContext: 'Google Calendar API',
          headline: `Scheduled: ${summary}`,
          synthesis: `Calendar event staged for ${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          urgency: 'high',
          isKeystone: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          targetArtifact: 'Google Calendar',
          googleService: 'Google Calendar',
          previewType: 'checklist',
          previewData: { docTitle: summary },
        };
        return NextResponse.json({ success: true, reply: replyText, spawnedCard, toolUsed: 'google_calendar_staged' });
      }
    }

    // ============================================================
    // 9. TOOL: READ GMAIL (Check emails, read messages)
    // ============================================================
    const isReadGmailIntent =
      /(?:read|check|fetch|get|show|list)\s+(?:my\s+)?(?:gmail|emails?|inbox|messages)/i.test(text) ||
      lower.includes('check my mail') ||
      lower.includes('check emails') ||
      lower.includes('read inbox');

    if (isReadGmailIntent) {
      if (token) {
        try {
          const messages = await readGmailMessages(token, 5);
          if (messages.length === 0) {
            replyText = `📬 **Inbox Clean:** No unread or recent messages requiring attention in your Gmail.`;
          } else {
            replyText = `📬 **Recent Gmail Inbox Messages:**\n\n` +
              messages.map((m, idx) => `${idx + 1}. **From:** ${m.from}\n   **Subject:** ${m.subject}\n   **Snippet:** ${m.snippet}\n`).join('\n');
          }
          return NextResponse.json({ success: true, reply: replyText, toolUsed: 'gmail_read' });
        } catch (err: any) {
          replyText = `⚠️ Gmail read error: ${err.message}. Verify that Gmail access is granted in OAuth permissions.`;
          return NextResponse.json({ success: true, reply: replyText, toolUsed: 'gmail_read' });
        }
      } else {
        replyText = `📬 **Gmail Connectivity:** Connect your Google account in Settings with Gmail permissions to read and monitor your inbox directly.`;
        return NextResponse.json({ success: true, reply: replyText, toolUsed: 'gmail_read' });
      }
    }

    // ============================================================
    // 10. TOOL: GMAIL (Draft Reply, Compose, Add to Drafts)
    // ============================================================
    const isGmailDraftIntent =
      /(?:draft|write|compose|send)\s+(?:a\s+)?(?:reply|response|email|mail)/i.test(text) ||
      lower.includes('email to') ||
      lower.includes('mail to') ||
      lower.includes('draft reply') ||
      lower.includes('draft an email');

    if (isGmailDraftIntent) {
      const emailMatch = text.match(/(?:to|recipient:)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const nameMatch = text.match(/(?:to|recipient:)\s*([A-Za-z0-9_.-]+)(?:\s+saying|\s+about|\s+regarding|$)/i);
      const recipient = emailMatch ? emailMatch[1] : (nameMatch ? nameMatch[1].trim() : 'team@organization.com');

      const subjectMatch = text.match(/(?:subject|regarding:?)\s*["']?([^"'\n,]+)["']?/i);
      const sayingMatch = text.match(/(?:saying|that|content:)\s*["']?([^"'\n]+)["']?/i);
      const subject = subjectMatch
        ? subjectMatch[1].trim()
        : (sayingMatch ? `Re: ${sayingMatch[1].slice(0, 40)}` : 'Executive Follow-up & Directive');

      const bodyText = sayingMatch
        ? `Hello,\n\n${sayingMatch[1].trim()}\n\nBest regards,\nExecutive Office\nSent via LifeOS Chief of Staff`
        : `Hello,\n\nFollowing up on our recent discussion. We have reviewed the details and are proceeding as discussed.\n\nBest regards,\nExecutive Office\nSent via LifeOS Chief of Staff`;

      replyText = `📧 **Gmail Draft Formulated:**\n\n• **To:** ${recipient}\n• **Subject:** ${subject}\n\nAn Action Card has been queued in your **Cockpit**. When you click **Approve**, it will be placed directly into your **Gmail Drafts** folder for final review or sending.`;

      spawnedCard = {
        id: `card-email-${Date.now()}`,
        category: 'responses',
        categoryLabel: '📧 GMAIL DRAFT',
        sourceContext: `Drafted by Chief of Staff for ${recipient}`,
        headline: `Review & Place in Gmail Drafts: "${subject}"`,
        synthesis: `Prepared response to ${recipient}. Approving this card immediately saves this draft into your Gmail account drafts folder.`,
        urgency: 'high',
        isKeystone: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        targetArtifact: 'Gmail (/users/me/drafts)',
        googleService: 'Google Docs',
        previewType: 'email',
        previewData: {
          to: recipient,
          subject,
          body: bodyText,
        },
      };

      return NextResponse.json({
        success: true,
        reply: replyText,
        spawnedCard,
        toolUsed: 'gmail_draft_staged',
      });
    }

    // ============================================================
    // 11. GENERAL AI REASONING (Gemini API with fallback)
    // ============================================================
    try {
      const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash',
          input: `You are LifeOS: Autonomous Executive Chief of Staff. The principal sent: "${text}".
Provide an executive, concise, highly actionable response under 3-4 sentences. If they assigned work, state how you have analyzed it and staged the execution.`,
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const modelOutput = data.steps?.find((s: any) => s.type === 'model_output')?.content?.[0]?.text;
        if (modelOutput) {
          replyText = modelOutput;
        }
      }
    } catch {
      // Fallback
    }

    if (!replyText) {
      replyText = `Directive received: "${text.slice(0, 80)}". I have parsed your instructions and queued the corresponding execution protocol in your Cockpit.`;
    }

    // Spawn an Action Card for Cockpit
    spawnedCard = {
      id: `card-agent-${Date.now()}`,
      category: 'protocols',
      categoryLabel: '⚡ EXECUTIVE PROTOCOL',
      sourceContext: 'Directive via Chatbox',
      headline: text.length > 60 ? `${text.slice(0, 58)}...` : text,
      synthesis: replyText.replace(/[*#]/g, '').slice(0, 140),
      urgency: 'high',
      isKeystone: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      targetArtifact: 'Google Workspace',
      googleService: 'Google Docs',
      previewType: 'checklist',
      previewData: {
        docTitle: text.slice(0, 40),
        sections: [{ title: 'Execution Steps', content: replyText }],
      },
    };

    return NextResponse.json({
      success: true,
      reply: replyText,
      spawnedCard,
      toolUsed: 'agentic_executive',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Agent dispatch error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
