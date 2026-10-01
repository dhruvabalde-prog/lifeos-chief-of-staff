import { NextRequest, NextResponse } from 'next/server';

/**
 * Send real WhatsApp message via Meta Cloud API
 * POST /api/integrations/whatsapp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumberId, accessToken, recipientPhone, messageText } = body;

    const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing WhatsApp Phone Number ID or Access Token. Configure them in Connections.',
        },
        { status: 400 }
      );
    }

    if (!recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required (with country code, e.g. +14155551234)' },
        { status: 400 }
      );
    }

    // Clean phone number (strip spaces, dashes, plus)
    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');

    // Call Meta WhatsApp Business Cloud API
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: messageText || '⚡ LifeOS Chief of Staff: Connection verified. System ready.' },
      }),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: metaData.error?.message || 'Failed to dispatch WhatsApp message via Meta Graph API',
          metaError: metaData.error,
        },
        { status: metaRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: metaData.messages?.[0]?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown WhatsApp dispatch error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
