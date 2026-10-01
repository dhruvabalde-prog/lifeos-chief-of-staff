import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json({ success: false, error: 'No API key provided' }, { status: 400 });
    }

    const startTime = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with the word "READY" only.' }] }],
      }),
    });

    const elapsed = Date.now() - startTime;
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { success: false, error: err.error?.message || 'Invalid Gemini API key' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'READY';

    return NextResponse.json({
      success: true,
      model: 'gemini-1.5-flash',
      latencyMs: elapsed,
      response: reply,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gemini test failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
