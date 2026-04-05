# IM Content System

A Next.js 14 web application for managing and generating SEO content using Claude AI.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file:
   ```
   JWT_SECRET=your-super-secret-key-change-in-production
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Login Credentials

| Username | Password | Role |
|----------|----------|------|
| gabby | infinite2025 | Admin |
| freymar | freymar2025 | Editor |
| doe | doe2025 | Viewer |

## Configuration

1. Log in as **gabby** (admin)
2. Go to **Settings**
3. Enter your Claude API key (starts with `sk-ant-api...`)
4. The key is stored in your browser's localStorage

## Features

- **Dashboard** — Stats overview and active clients list
- **Content Generator** — Multi-step content generation with Claude AI
  - Blog Post Package (7 pieces)
  - Landing Page
  - Location Page
  - GBP Post
- **Clients** — Full CRUD for client profiles with auto-generate system prompts
- **Reports** — Folder manager by month/client/topic
- **Settings** — API key management (admin only)

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variable: `JWT_SECRET=your-secret`
4. Deploy

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Jose (JWT auth)
- JSZip (ZIP downloads)
- Anthropic SDK (Claude AI)
