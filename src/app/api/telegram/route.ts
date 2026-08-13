import { NextResponse } from 'next/server';
import { escapeHtml, sendTelegramMessage } from './telegramUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let message = '';
    let reply_markup: any = undefined;
    const origin = request.headers.get('origin') || new URL(request.url).origin;

    if (body.type === 'note') {
      message = `📝 <b>Ghi chú mới trên Wall of Notes!</b>\n\n👤 <b>Người gửi:</b> ${escapeHtml(body.author)}\n💬 <b>Nội dung:</b> ${escapeHtml(body.content)}`;
      reply_markup = {
        inline_keyboard: [
          [
            { text: "🌐 Xem trên Web", url: origin },
            { text: "📢 Chia sẻ", url: `https://t.me/share/url?url=${encodeURIComponent(origin)}&text=${encodeURIComponent("Ghi chú mới trên Wall of Notes!")}` }
          ]
        ]
      };
    } else if (body.type === 'visitor') {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
      const country = request.headers.get('x-vercel-ip-country') || 'Unknown Country';
      const city = request.headers.get('x-vercel-ip-city') || 'Unknown City';
      
      message = `👀 <b>Có người đang xem Wall of Notes!</b>\n\n` +
                `🌍 <b>Quốc gia:</b> ${country} (${city})\n` +
                `📍 <b>IP:</b> <code>${escapeHtml(ip)}</code>\n` +
                `🔗 <b>URL:</b> ${escapeHtml(body.url)}\n` +
                `🌐 <b>Nguồn:</b> ${escapeHtml(body.referrer || 'Trực tiếp')}\n` +
                `🖥️ <b>Màn hình:</b> ${escapeHtml(body.screen)}\n` +
                `🗣️ <b>Ngôn ngữ:</b> ${escapeHtml(body.language)}\n` +
                `💻 <b>Thiết bị:</b> <code>${escapeHtml(body.userAgent)}</code>`;
                
      reply_markup = {
        inline_keyboard: [
          [
            { text: "🌐 Truy cập Web", url: origin }
          ]
        ]
      };
    }

    if (!message) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    const success = await sendTelegramMessage(botToken, chatId, message, reply_markup);

    if (!success) {
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
