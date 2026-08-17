import { NextResponse } from 'next/server';
import { telegramService } from '../services/telegramService';

export const telegramController = {
  async notificationHandler(request: Request) {
    try {
      const body = await request.json();
      const origin = request.headers.get('origin') || new URL(request.url).origin;
      
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
      const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country';
      const city = request.headers.get('x-vercel-ip-city') || 'Unknown City';

      await telegramService.sendNotification(body, origin, { ip, country, city });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Telegram notification error:', error);
      if (error.message === 'Invalid message type') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
  },

  async webhookHandler(request: Request) {
    try {
      const body = await request.json();
      const origin = request.headers.get('origin') || new URL(request.url).origin;
      
      await telegramService.handleWebhook(body, origin);
      
      // Always return 200 OK so Telegram knows we received it
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
};
