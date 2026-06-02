import { NextResponse } from 'next/server';

/**
 * Resend Webhook Forwarder
 *
 * Receives webhooks from Resend via HTTPS (Vercel)
 * and forwards to VPS API for processing.
 *
 * Webhook URL: https://utune-ai.vercel.app/api/webhooks/resend
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log('[Webhook Forwarder] Received from Resend:', payload.type);

    // Forward to VPS API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://43.129.54.139:3001';
    const response = await fetch(`${apiUrl}/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Webhook Forwarder] API error:', response.status);
      return NextResponse.json(
        { success: false, error: 'Failed to forward webhook' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('[Webhook Forwarder] Forwarded successfully');

    return NextResponse.json({ success: true, forwarded: true });
  } catch (error) {
    console.error('[Webhook Forwarder] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
