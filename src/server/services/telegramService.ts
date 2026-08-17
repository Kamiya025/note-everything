import { supabase } from '../../lib/supabase';
import { PRESET_COLORS } from '../../types';

export const telegramService = {
  TELEGRAM_API_URL: 'https://api.telegram.org',

  escapeHtml(text: string) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  async sendTelegramMessage(
    botToken: string | undefined,
    chatId: string | number | undefined,
    msg: string,
    replyMarkup?: any
  ) {
    if (!botToken || !chatId) {
      console.warn('Missing Telegram Bot Token or Chat ID');
      return false;
    }
    
    const payload: any = {
      chat_id: chatId,
      text: msg,
      parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    try {
      const response = await fetch(`${this.TELEGRAM_API_URL}/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Telegram API Error Data:', errorData);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Telegram Fetch Error:', error);
      return false;
    }
  },

  async sendNotification(data: any, origin: string, clientInfo: { ip: string, country: string, city: string }) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let message = '';
    let reply_markup: any = undefined;

    if (data.type === 'note') {
      message = `📝 <b>Ghi chú mới trên Wall of Notes!</b>\n\n👤 <b>Người gửi:</b> ${this.escapeHtml(data.author)}\n💬 <b>Nội dung:</b> ${this.escapeHtml(data.content)}`;
      reply_markup = {
        inline_keyboard: [
          [
            { text: "🌐 Xem trên Web", url: origin },
            { text: "📢 Chia sẻ", url: `https://t.me/share/url?url=${encodeURIComponent(origin)}&text=${encodeURIComponent("Ghi chú mới trên Wall of Notes!")}` }
          ]
        ]
      };
    } else if (data.type === 'visitor') {
      message = `👀 <b>Có người đang xem Wall of Notes!</b>\n\n` +
                `🌍 <b>Quốc gia:</b> ${clientInfo.country} (${clientInfo.city})\n` +
                `📍 <b>IP:</b> <code>${this.escapeHtml(clientInfo.ip)}</code>\n` +
                `🔗 <b>URL:</b> ${this.escapeHtml(data.url)}\n` +
                `🌐 <b>Nguồn:</b> ${this.escapeHtml(data.referrer || 'Trực tiếp')}\n` +
                `🖥️ <b>Màn hình:</b> ${this.escapeHtml(data.screen)}\n` +
                `🗣️ <b>Ngôn ngữ:</b> ${this.escapeHtml(data.language)}\n` +
                `💻 <b>Thiết bị:</b> <code>${this.escapeHtml(data.userAgent)}</code>`;
                
      reply_markup = {
        inline_keyboard: [
          [
            { text: "🌐 Truy cập Web", url: origin }
          ]
        ]
      };
    }

    if (!message) {
      throw new Error('Invalid message type');
    }

    const success = await this.sendTelegramMessage(botToken, chatId, message, reply_markup);
    if (!success) {
      throw new Error('Failed to send notification');
    }
    return true;
  },

  async handleWebhook(body: any, origin: string) {
    // Check if it's a message containing text
    if (!body.message || !body.message.text) {
      return true; // Ignore
    }

    const text = body.message.text;
    const author = body.message.from?.first_name || 'Anonymous';
    const chatId = body.message.chat?.id;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const replyToChat = async (msg: string, replyMarkup?: any) => {
      return this.sendTelegramMessage(botToken, chatId, msg, replyMarkup);
    };

    const chatType = body.message.chat?.type;
    const isGroup = chatType === 'group' || chatType === 'supergroup';
    
    let isNoteCommand = false;
    let rawContent = '';

    // Command handling
    if (text.startsWith('/')) {
      const commandStr = text.split(/\s+/)[0].toLowerCase();
      const command = commandStr.split('@')[0];
      
      switch (command) {
        case '/start':
        case '/help':
          await replyToChat(
            `🤖 <b>Welcome to Wall of Notes Bot!</b>\n\n` +
            `Just send a normal message, and it will be posted directly to the web wall!\n\n` +
            `📋 <b>Command List:</b>\n` +
            `• <code>/help</code> - Show this guide\n` +
            `• <code>/stats</code> - View the total number of notes on the wall\n` +
            `• <code>/random</code> - Read a random note from the wall\n` +
            `• <code>/note</code> - Post a note (useful in groups)\n\n` +
            `<i>Note: Messages sent from the bot have a maximum length of 150 characters.</i>`
          );
          return true;
          
        case '/stats':
          if (supabase) {
            const { count, error } = await supabase
              .from('notes')
              .select('*', { count: 'exact', head: true });
              
            if (!error) {
              await replyToChat(`📊 <b>Wall of Notes Stats</b>\n\nThere are currently <b>${count || 0}</b> notes pinned on the wall!`);
            } else {
              await replyToChat(`❌ Error fetching statistics.`);
            }
          }
          return true;

        case '/random':
          if (supabase) {
            const { data, error } = await supabase
              .from('notes')
              .select('content, author')
              .order('createdAt', { ascending: false })
              .limit(50);
              
            if (error) {
              console.error('Error fetching random note:', error);
              await replyToChat(`❌ Error fetching notes.`);
            } else if (data && data.length > 0) {
              const randomNote = data[Math.floor(Math.random() * data.length)];
              await replyToChat(`🎲 <b>Random Note:</b>\n\n👤 <b>By:</b> ${randomNote.author}\n💬 <b>Content:</b> ${randomNote.content}`);
            } else {
              await replyToChat(`❌ The wall currently has no notes.`);
            }
          }
          return true;

        case '/note':
          isNoteCommand = true;
          rawContent = text.substring(commandStr.length).trim();
          break;

        default:
          await replyToChat(`❓ Invalid command. Type <code>/help</code> to see the command list.`);
          return true;
      }
    } else {
      // Not a command
      if (!isGroup) {
        // Private chat: accept any text as a note
        isNoteCommand = true;
        rawContent = text.trim();
      } else {
        // Group chat: check if the bot is mentioned at the start
        const entities = body.message.entities || [];
        const mention = entities.find((e: any) => e.type === 'mention' && e.offset === 0);
        if (mention) {
          isNoteCommand = true;
          rawContent = text.substring(mention.length).trim();
        }
      }
    }

    if (!isNoteCommand) {
      return true;
    }

    if (!rawContent) {
      await replyToChat(`❌ Please provide the note content.\n\nUsage: <code>/note Your note here</code>\nOr tag the bot: <code>@BotName Your note here</code>`);
      return true;
    }

    // Handle normal message as a new note
    // Ensure text-only and max 150 characters
    let cleanContent = rawContent.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    if (cleanContent.length > 150) {
      cleanContent = cleanContent.substring(0, 150);
    }
    
    if (!cleanContent) {
      return true; // Acknowledge to stop retries
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
        await replyToChat(`❌ Error posting note to the wall.`);
      } else {
        const reply_markup = {
          inline_keyboard: [
            [
              { text: "🌐 View on Web", url: origin },
              { text: "📢 Share", url: `https://t.me/share/url?url=${encodeURIComponent(origin)}&text=${encodeURIComponent("New note on Wall of Notes!")}` }
            ]
          ]
        };

        // Send confirmation message back to the user
        await replyToChat(
          `✅ Your note has been pinned to the wall!\n\n"${cleanContent}"`,
          reply_markup
        );

        // Send notification to the group
        const groupChatId = process.env.TELEGRAM_CHAT_ID;
        if (groupChatId && groupChatId !== chatId.toString()) {
          const groupMessage = `📝 <b>New note on Wall of Notes!</b>\n\n👤 <b>Sender:</b> ${this.escapeHtml(author)} (via Bot)\n💬 <b>Content:</b> ${this.escapeHtml(cleanContent)}`;
          await this.sendTelegramMessage(botToken, groupChatId, groupMessage, reply_markup);
        }
      }
    }

    return true;
  }
};
