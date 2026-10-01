import { NextRequest, NextResponse } from 'next/server';
import { geminiStaff } from '@/lib/integrations/gemini';
import { ActionCard } from '@/types/lifeos';

// Free-Tier Model Routing Priority:
// 1. gemini-1.5-flash-8b (Ultra-lightweight, lowest token consumption, highest free rate limits)
// 2. gemini-1.5-flash (Standard flash model)
// 3. Heuristic Zero-Token Engine (Graceful quota protection if rate limited)
const FREE_TIER_MODELS = [
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

async function callGeminiWithModelRouting(prompt: string, apiKey: string, responseSchema?: any) {
  for (const model of FREE_TIER_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 550, // Conserve output tokens on free tier
            temperature: 0.1,     // Low temperature for crisp, deterministic executive output
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { modelUsed: model, data: JSON.parse(text) };
        }
      } else {
        console.warn(`[LifeOS Model Router] Model ${model} returned status ${response.status}. Attempting next tier.`);
      }
    } catch (err) {
      console.warn(`[LifeOS Model Router] Error calling ${model}:`, err);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, inputType, card, critiqueText, functionCall } = body;
    const apiKey = process.env.GEMINI_API_KEY || '';

    // ACTION 1: Quick Critique Re-draft
    if (action === 'critique' && card && critiqueText) {
      if (apiKey) {
        const critiquePrompt = `You are LifeOS Autonomous Executive Chief of Staff. Modify this Action Card based on the user's critique.
CURRENT HEADLINE: ${card.headline}
CURRENT SYNTHESIS: ${card.synthesis}
CURRENT PREVIEW: ${JSON.stringify(card.previewData)}
USER CRITIQUE: "${critiqueText}"

Return JSON matching:
{
  "headline": string,
  "synthesis": string,
  "previewData": object matching previous preview structure with applied critique,
  "explanation": "Brief 1-sentence explanation"
}`;

        const result = await callGeminiWithModelRouting(critiquePrompt, apiKey);
        if (result?.data) {
          return NextResponse.json({ success: true, redraft: result.data, modelUsed: result.modelUsed });
        }
      }

      // Quota-safe heuristic fallback
      const redraft = await geminiStaff.redraftWithCritique(card as ActionCard, critiqueText);
      return NextResponse.json({ success: true, redraft, modelUsed: 'heuristic_zero_token' });
    }

    // ACTION 2: Parse Directive / Voice Note into Action Card
    if (action === 'parse_directive' && text) {
      if (apiKey) {
        const parsePrompt = `You are LifeOS Executive Chief of Staff. Convert this directive into a structured Action Card.
DIRECTIVE: "${text}"

Choose category: "responses" | "artifacts" | "protocols" | "lifeops".
Return JSON matching:
{
  "category": "responses" | "artifacts" | "protocols" | "lifeops",
  "categoryLabel": string,
  "headline": string,
  "synthesis": string,
  "urgency": "critical" | "high" | "medium" | "low",
  "isKeystone": boolean,
  "previewType": "email" | "document" | "invoice" | "checklist" | "data",
  "previewData": { "to"?: string, "subject"?: string, "body"?: string, "docTitle"?: string, "vendor"?: string, "amount"?: string, "sections"?: Array<{ "title": string, "content": string }> },
  "targetArtifact": string,
  "googleService": "Google Drive" | "Google Sheets" | "Google Calendar" | "Google Tasks" | "Google Docs"
}`;

        const result = await callGeminiWithModelRouting(parsePrompt, apiKey);
        if (result?.data) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const spawned: ActionCard = {
            id: `card-ai-${Date.now()}`,
            category: result.data.category || 'responses',
            categoryLabel: result.data.categoryLabel || '⚡ EXECUTIVE DIRECTIVE',
            sourceContext: `AI Synthesized via ${result.modelUsed} (${now})`,
            headline: result.data.headline || text.slice(0, 70),
            synthesis: result.data.synthesis || 'Chief of Staff has formulated execution protocol.',
            urgency: result.data.urgency || 'high',
            isKeystone: Boolean(result.data.isKeystone),
            status: 'pending',
            createdAt: new Date().toISOString(),
            targetArtifact: result.data.targetArtifact || 'Google Workspace',
            googleService: result.data.googleService || 'Google Docs',
            previewType: result.data.previewType || 'email',
            previewData: result.data.previewData || { body: text },
          };

          return NextResponse.json({ success: true, result: { rawTranscription: text, card: spawned }, modelUsed: result.modelUsed });
        }
      }

      // Quota-safe 21-skill catalog parser fallback
      const fallbackResult = await geminiStaff.parseDirective(text, inputType || 'voice');
      return NextResponse.json({ success: true, result: fallbackResult, modelUsed: 'skills_catalog_zero_token' });
    }

    // ACTION 3: Calling Function / Executive Dispatch
    if (action === 'call_function' && functionCall) {
      return NextResponse.json({
        success: true,
        dispatched: true,
        function: functionCall.name,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action parameters' }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown AI processing failure';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
