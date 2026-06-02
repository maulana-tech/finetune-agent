import { Controller, Post, Body, HttpCode, Headers, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { EmailService } from './email.service';

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
  };
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Verify Resend webhook signature
   */
  private verifySignature(payload: string, signature: string): boolean {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('[Webhook] RESEND_WEBHOOK_SECRET not set - skipping verification');
      return true; // Allow if secret not configured (dev mode)
    }

    try {
      const hmac = createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Resend sends signature as "v1,<signature>"
      const actualSignature = signature.split(',')[1] || signature;

      return expectedSignature === actualSignature;
    } catch (error) {
      console.error('[Webhook] Signature verification error:', error);
      return false;
    }
  }

  @Post('resend')
  @HttpCode(200)
  async handleResendWebhook(
    @Body() payload: ResendWebhookPayload,
    @Headers('svix-signature') signature?: string,
  ) {
    // Verify signature
    const rawPayload = JSON.stringify(payload);
    if (signature && !this.verifySignature(rawPayload, signature)) {
      console.error('[Webhook] Invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }
    const { type, data } = payload;

    console.log(`[Resend Webhook] ${type} - Email ID: ${data.email_id}`);

    try {
      switch (type) {
        case 'email.sent':
          await this.emailService.updateEmailStatus(data.email_id, 'sent');
          break;

        case 'email.delivered':
          await this.emailService.updateEmailStatus(data.email_id, 'delivered');
          break;

        case 'email.delivery_delayed':
          // Keep status as 'sent', just log the delay
          console.log(`[Resend Webhook] Delivery delayed for ${data.email_id}`);
          break;

        case 'email.complained':
        case 'email.bounced':
          await this.emailService.updateEmailStatus(data.email_id, 'bounced');
          break;

        case 'email.opened':
          await this.emailService.markEmailOpened(data.email_id);
          break;

        case 'email.clicked':
          await this.emailService.markEmailClicked(data.email_id);
          break;

        default:
          console.log(`[Resend Webhook] Unhandled event type: ${type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[Resend Webhook] Error processing webhook:', error);
      // Return 200 anyway to prevent Resend from retrying
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
