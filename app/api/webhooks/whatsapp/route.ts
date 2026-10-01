import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'lifeos_chief_of_staff_secure_token';

/**
 * WhatsApp Webhook Receiver for LifeOS
 * GET: Handles Meta / WhatsApp Cloud API verification handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification token mismatch or invalid mode' }, { status: 403 });
}

/**
 * POST: Handles incoming media, voice notes, documents, and messages from WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Standard WhatsApp webhook payload structure extraction
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    const messageType = message?.type || payload?.type || 'text';
    const sender = message?.from || payload?.sender || 'Unknown Executive';
    const textBody = message?.text?.body || payload?.text || payload?.caption || 'Incoming WhatsApp Directive';

    console.log(`[LifeOS WhatsApp Receiver] Ingested message from ${sender} (Type: ${messageType})`);

    // In a full production pipeline, this persists to Supabase and triggers push notification
    return NextResponse.json({
      success: true,
      ingestedAt: new Date().toISOString(),
      sender,
      messageType,
      receivedDirective: textBody,
      status: 'dispatched_to_cockpit_deck',
    }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
