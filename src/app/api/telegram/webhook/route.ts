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
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      const sendTelegramMessage = async (msg: string) => {
        if (!botToken || !chatId) return;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: 'HTML'
          }),
        });
      };

      // Command handling
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        
        switch (command) {
          case '/start':
          case '/help':
            await sendTelegramMessage(
              `🤖 <b>Welcome to Wall of Notes Bot!</b>\n\n` +
              `Just send a normal message, and it will be posted directly to the web wall!\n\n` +
              `📋 <b>Command List:</b>\n` +
              `• <code>/help</code> - Show this guide\n` +
              `• <code>/stats</code> - View the total number of notes on the wall\n` +
              `• <code>/random</code> - Read a random note from the wall\n\n` +
              `<i>Note: Messages sent from the bot have a maximum length of 150 characters.</i>`
            );
            break;
            
          case '/stats':
            if (supabase) {
              const { count, error } = await supabase
                .from('notes')
                .select('*', { count: 'exact', head: true });
                
              if (!error) {
                await sendTelegramMessage(`📊 <b>Wall of Notes Stats</b>\n\nThere are currently <b>${count || 0}</b> notes pinned on the wall!`);
              } else {
                await sendTelegramMessage(`❌ Error fetching statistics.`);
              }
            }
            break;

          case '/random':
            if (supabase) {
              const { data, error } = await supabase
                .from('notes')
                .select('content, author')
                .order('createdAt', { ascending: false })
                .limit(50);
                
              if (error) {
                console.error('Error fetching random note:', error);
                await sendTelegramMessage(`❌ Error fetching notes.`);
              } else if (data && data.length > 0) {
                const randomNote = data[Math.floor(Math.random() * data.length)];
                await sendTelegramMessage(`🎲 <b>Random Note:</b>\n\n👤 <b>By:</b> ${randomNote.author}\n💬 <b>Content:</b> ${randomNote.content}`);
              } else {
                await sendTelegramMessage(`❌ The wall currently has no notes.`);
              }
            }
            break;

          default:
            await sendTelegramMessage(`❓ Invalid command. Type <code>/help</code> to see the command list.`);
        }
        return NextResponse.json({ success: true });
      }

      // Handle normal message as a new note
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
          await sendTelegramMessage(`❌ Error posting note to the wall.`);
        } else {
          // Send confirmation message back to the user
          await sendTelegramMessage(`✅ Your note has been pinned to the wall!\n\n"${cleanContent}"`);

          // Send notification to the group
          const groupChatId = process.env.TELEGRAM_CHAT_ID;
          if (groupChatId && groupChatId !== chatId.toString()) {
            const origin = request.headers.get('origin') || new URL(request.url).origin;
            const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            const groupMessage = `📝 <b>Ghi chú mới trên Wall of Notes!</b>\n\n👤 <b>Người gửi:</b> ${escapeHtml(author)} (via Bot)\n💬 <b>Nội dung:</b> ${escapeHtml(cleanContent)}`;
            
            const reply_markup = {
              inline_keyboard: [
                [
                  { text: "🌐 Xem trên Web", url: origin },
                  { text: "📢 Chia sẻ", url: `https://t.me/share/url?url=${encodeURIComponent(origin)}&text=${encodeURIComponent("Ghi chú mới trên Wall of Notes!")}` }
                ]
              ]
            };

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: groupChatId,
                text: groupMessage,
                parse_mode: 'HTML',
                reply_markup: reply_markup
              })
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
