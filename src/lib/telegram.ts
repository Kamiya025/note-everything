export async function sendTelegramNotification(content: string, author: string) {
  try {
    await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', content, author })
    });
  } catch (error) {
    console.error("Failed to send telegram notification:", error);
  }
}

export async function sendVisitorNotification() {
  try {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const url = window.location.href;
    const referrer = document.referrer;

    await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visitor', userAgent, language, screen, url, referrer })
    });
  } catch (error) {
    console.error("Failed to send visitor notification:", error);
  }
};
