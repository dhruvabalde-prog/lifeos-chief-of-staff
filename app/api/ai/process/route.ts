import { NextRequest, NextResponse } from 'next/server';
import { geminiStaff } from '@/lib/integrations/gemini';
import { ActionCard } from '@/types/lifeos';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, inputType, card, critiqueText } = body;

    if (action === 'critique' && card && critiqueText) {
      const redraft = await geminiStaff.redraftWithCritique(card as ActionCard, critiqueText);
      return NextResponse.json({ success: true, redraft });
    }

    if (action === 'parse_directive' && text) {
      const result = await geminiStaff.parseDirective(text, inputType || 'voice');
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action parameters' }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown AI processing failure';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
