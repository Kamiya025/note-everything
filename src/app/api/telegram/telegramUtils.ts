export const escapeHtml = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const sendTelegramMessage = async (
  botToken: string | undefined,
  chatId: string | number | undefined,
  msg: string,
  replyMarkup?: any
) => {
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
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
};
