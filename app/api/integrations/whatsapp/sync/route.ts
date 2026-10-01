import { NextRequest, NextResponse } from 'next/server';

// Shared in-memory message store for WhatsApp <-> LifeOS sync during server runtime
// In persistent production, this bridges with PostgreSQL / Supabase
interface SyncedWhatsAppMessage {
  id: string;
  sender: 'user' | 'staff';
  senderPhone?: string;
  text: string;
  timestamp: string;
  source: 'whatsapp' | 'app';
  mediaUrl?: string;
  mediaType?: 'voice' | 'image' | 'document';
}

const syncMessageStore: SyncedWhatsAppMessage[] = [
  {
    id: 'wa-init-1',
    sender: 'user',
    senderPhone: '+1 (555) 019-2831',
    text: 'Chief, check if Apollo hospital covers cashless for our policy and send counter to Apex Capital.',
    timestamp: '09:12 AM',
    source: 'whatsapp',
  },
  {
    id: 'wa-init-2',
    sender: 'staff',
    text: 'Understood. Apollo Hospital cashless network verified. Counter-offer for Apex Capital ($18M cap) queued in your Cockpit for approval.',
    timestamp: '09:13 AM',
    source: 'app',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  let filtered = syncMessageStore;
  if (since) {
    const sinceIdx = syncMessageStore.findIndex((m) => m.id === since);
    if (sinceIdx !== -1) {
      filtered = syncMessageStore.slice(sinceIdx + 1);
    }
  }

  return NextResponse.json({
    success: true,
    messages: filtered,
    lastId: syncMessageStore[syncMessageStore.length - 1]?.id || null,
    total: syncMessageStore.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sender = 'user', source = 'app', senderPhone, mediaUrl, mediaType } = body;

    if (!text && !mediaUrl) {
      return NextResponse.json({ success: false, error: 'Text or media required' }, { status: 400 });
    }

    const newMessage: SyncedWhatsAppMessage = {
      id: `wa-msg-${Date.now()}`,
      sender,
      senderPhone: senderPhone || '+1 (555) 019-2831',
      text: text || 'Media attachment received from WhatsApp',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: source || 'app',
      mediaUrl,
      mediaType,
    };

    syncMessageStore.push(newMessage);

    // Limit memory buffer
    if (syncMessageStore.length > 100) {
      syncMessageStore.shift();
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Sync dispatch failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
