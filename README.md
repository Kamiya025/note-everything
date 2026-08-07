# Note Everything - Wall of Notes

Welcome to **Note Everything**, a beautiful, interactive digital sticky note wall where anyone can leave a note! 

Built with the modern web stack, this project features real-time updates, glassmorphism design, and a fun interactive experience.

## ✨ Features

- **Interactive Wall**: A dynamic, beautiful wall where notes look like real sticky notes.
- **Real-time Updates**: Powered by Supabase Realtime, notes appear instantly for all users viewing the wall.
- **Telegram Integration**: 
  - **Notifications**: Get notified on Telegram whenever someone leaves a note.
  - **Create via Bot**: Send a message directly to your Telegram Bot, and it will automatically be posted on the wall!
- **Modern Design**: Built with Tailwind CSS v4, featuring aesthetic backgrounds, glass panels, and smooth animations.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Realtime**: [Supabase](https://supabase.com/)
- **State Management**: [React Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd note-everything
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 3. Run the Development Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤖 Telegram Bot Webhook Setup (Local Development)

To allow the Telegram Bot to receive messages and create notes on your local machine, you need to expose your local server to the internet using **ngrok**:

1. Install and start ngrok on port 3000:
```bash
ngrok http 3000
```
2. Copy the `https` Forwarding URL provided by ngrok (e.g., `https://<your-id>.ngrok-free.app`).
3. Open your browser and register the webhook with Telegram by replacing `<YOUR_BOT_TOKEN>` and `<YOUR_NGROK_URL>` in this URL:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_NGROK_URL>/api/telegram/webhook
```
4. If successful, you will see `{"ok":true,"result":true,"description":"Webhook was set"}`. 
5. Try sending a message to your bot on Telegram!
