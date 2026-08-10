import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Telegram config missing' }, { status: 500 });
    }

    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    let message = '';
    if (body.type === 'note') {
      const origin = request.headers.get('origin') || new URL(request.url).origin;
      message = `📝 <b>Ghi chú mới trên Wall of Notes!</b>\n\n👤 <b>Người gửi:</b> ${escapeHtml(body.author)}\n💬 <b>Nội dung:</b> ${escapeHtml(body.content)}\n\n🌐 <a href="${origin}">Xem trên Web</a>`;
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
    }

    if (!message) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API Error Data:', errorData);
      throw new Error(`Telegram API Error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
