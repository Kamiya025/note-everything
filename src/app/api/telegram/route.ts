import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Telegram config missing' }, { status: 500 });
    }

    let message = '';
    if (body.type === 'note') {
      message = `📝 *Ghi chú mới trên Wall of Notes!*\n\n👤 *Người gửi:* ${body.author}\n💬 *Nội dung:* ${body.content}`;
    } else if (body.type === 'visitor') {
      message = `👀 *Có người đang xem Wall of Notes!*\n\n💻 *Thiết bị:* \`${body.userAgent}\``;
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
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API Error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
