import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { PRESET_COLORS } from '../../../../types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's a message containing text
    if (body.message && body.message.text) {
      const text = body.message.text;
      const author = body.message.from?.first_name || 'Anonymous';
      const chatId = body.message.chat?.id;

      // Ensure text-only and max 150 characters
      let cleanContent = text.trim().replace(/<[^>]*>?/gm, ''); // Strip HTML tags
      if (cleanContent.length > 150) {
        cleanContent = cleanContent.substring(0, 150);
      }
      
      if (!cleanContent) {
        return NextResponse.json({ success: true }); // Acknowledge to stop retries
      }

      // Pick a random color
      const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

      // Insert into Supabase
      if (supabase) {
        const { error } = await supabase
          .from('notes')
          .insert([
            {
              content: cleanContent,
              author: author,
              color: randomColor,
            }
          ]);
          
        if (error) {
          console.error('Error inserting note from Telegram:', error);
        } else if (chatId) {
          // Send confirmation message back to the user
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (botToken) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: `✅ Note của bạn đã được dán lên tường!\n\n"${cleanContent}"`,
              }),
            });
          }
        }
      }
    }
    
    // Always return 200 OK so Telegram knows we received it
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
