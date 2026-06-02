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

    // Get signature header from Resend
    const signature = request.headers.get('svix-signature');
    const timestamp = request.headers.get('svix-timestamp');
    const id = request.headers.get('svix-id');

    console.log('[Webhook Forwarder] Received from Resend:', payload.type);

    // Forward to VPS API with signature headers
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://43.129.54.139:3001';
    const response = await fetch(`${apiUrl}/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'svix-signature': signature }),
        ...(timestamp && { 'svix-timestamp': timestamp }),
        ...(id && { 'svix-id': id }),
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
