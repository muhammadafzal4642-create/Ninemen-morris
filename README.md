# Navakankari - Nine Men's Morris 🎮

A modern, responsive web application for **Navakankari (Nine Men's Morris)**, the classic strategy board game. Built with React 19, TypeScript, Tailwind CSS, and Vite.

## ✨ Features

- **Multiple Game Modes**:
  - 🤖 **Single Player vs AI**: Play against an intelligent computer opponent with Easy, Medium, and Hard difficulty settings.
  - 👥 **Local 2-Player**: Pass-and-play on the same device.
  - 🌐 **Online Multiplayer**: Real-time room-based matches across devices powered by Supabase Realtime (with instant local cross-tab fallback via BroadcastChannel).
- **Full Game Logic**: Complete implementation of Placement phase, Movement phase, Mill formation/capture, and the Flying phase when a player has 3 pieces remaining.
- **Audio & Visual Polish**: Interactive sounds, move indicators, valid destination hints, animations, and celebratory confetti.
- **Customizable Themes**: Multiple visual board themes and piece styles.

---

## 🚀 Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/muhammadafzal4642-create/Ninemen-morris.git
   cd Ninemen-morris
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials if you want persistent online multiplayer:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Vercel

This repository is pre-configured for instant deployment on [Vercel](https://vercel.com):

1. **Import the repository**:
   - Go to your [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** > **Project**.
   - Select the `Ninemen-morris` repository.

2. **Configure Build Settings** (Vercel automatically detects these from `vercel.json`):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables** (Optional, for online multiplayer):
   - Under **Environment Variables**, add:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key

4. Click **Deploy**! 🚀

---

## 🗄️ Supabase Setup (For Online Multiplayer)

If you wish to host cloud multiplayer rooms:
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Copy your project's **Project URL** and **anon public key** from Project Settings > API into your `.env.local` or Vercel environment variables.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/), [canvas-confetti](https://github.com/catdad/canvas-confetti)
- **Backend / Realtime**: [Supabase](https://supabase.com/) & Web BroadcastChannel API
- **Deployment**: [Vercel](https://vercel.com/)
