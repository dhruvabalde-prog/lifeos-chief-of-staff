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
  deleteGoogleCalendarEvent,
  createGmailDraft,
} from '@/lib/integrations/googleWorkspaceAgent';
import { conductWebResearch } from '@/lib/integrations/webResearchAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, accessToken: providedToken } = body;

    const token =
      providedToken ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('google_access_token')?.value ||
      '';

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const lower = text.toLowerCase();
    let replyText = '';
    let spawnedCard: ActionCard | undefined = undefined;
    let toolResult: any = null;

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
    // 2. TOOL: GOOGLE DOCS (Create, Edit, Delete)
    // ============================================================
    if (lower.includes('create doc') || lower.includes('make a doc') || lower.includes('write doc') || lower.includes('new doc') || lower.includes('google doc')) {
      const titleMatch = text.match(/(?:named|called|titled|title:)\s*["']?([^"'\n,]+)["']?/i);
      const title = titleMatch ? titleMatch[1].trim() : `LifeOS Executive Brief - ${new Date().toLocaleDateString()}`;

      if (token) {
        try {
          const doc = await createGoogleDoc(token, title, text);
          toolResult = doc;
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
      }
    }

    // ============================================================
    // 3. TOOL: GOOGLE SHEETS (Create, Edit, Delete)
    // ============================================================
    if (lower.includes('create sheet') || lower.includes('make a sheet') || lower.includes('spreadsheet') || lower.includes('google sheet')) {
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
      }
    }

    // ============================================================
    // 4. TOOL: GOOGLE SLIDES (Create Presentation)
    // ============================================================
    if (lower.includes('create slide') || lower.includes('make slides') || lower.includes('presentation') || lower.includes('google slide') || lower.includes('pitch deck')) {
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
      }
    }

    // ============================================================
    // 5. TOOL: GOOGLE TASKS (Add, Edit, Delete)
    // ============================================================
    if (lower.includes('add task') || lower.includes('create task') || lower.includes('remind me to') || lower.includes('todo') || lower.includes('to-do')) {
      const taskTitle = text
        .replace(/^(please\s+)?(can you\s+)?(add a task to|create a task to|add task:|remind me to|add todo:)\s+/i, '')
        .trim();

      if (token) {
        try {
          const created = await createGoogleTask(token, taskTitle, `Delegated via LifeOS on ${new Date().toLocaleTimeString()}`);
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
      }
    }

    // ============================================================
    // 6. TOOL: GOOGLE CALENDAR (Add Event, Schedule)
    // ============================================================
    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('book meeting') || lower.includes('appointment')) {
      const summaryMatch = text.match(/(?:meeting with|schedule|calendar event:?)\s*([^0-9\n,]+)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Scheduled Meeting';

      // Default to 1 hour from now
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 7200000).toISOString();

      if (token) {
        try {
          const calEvent = await createGoogleCalendarEvent(token, {
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
      }
    }

    // ============================================================
    // 7. TOOL: GMAIL (Draft Reply, Compose, Add to Drafts)
    // ============================================================
    if (lower.includes('email') || lower.includes('gmail') || lower.includes('draft reply') || lower.includes('send mail') || lower.includes('write an email')) {
      const recipientMatch = text.match(/(?:to|recipient:)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const recipient = recipientMatch ? recipientMatch[1] : 'partner@apexcapital.com';

      const subjectMatch = text.match(/(?:subject|regarding:?)\s*["']?([^"'\n,]+)["']?/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Executive Follow-up & Directive';

      const bodyText = `Hello,\n\nFollowing up on our recent discussion. We have reviewed the details and are proceeding as discussed.\n\nBest regards,\nExecutive Office\nSent via LifeOS Chief of Staff`;

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
    // 8. GENERAL AI REASONING (Gemini API with fallback)
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
