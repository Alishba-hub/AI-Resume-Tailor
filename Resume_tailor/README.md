# AI-Powered Resume Tailor Web

A modern web application that generates ATS-friendly, job-specific resumes using AI. Built with **Next.js 14**, **Tailwind CSS**, and **Supabase** for seamless user authentication and data handling.

## ✨ Features

- 🔐 Email-based authentication via Supabase
- 📄 AI-generated resume content tailored to job descriptions
- 💾 Save resumes to your dashboard
- ⚡ Fast UI with Next.js App Router and Tailwind CSS
- ☁️ Deployed on Vercel

## 🛠 Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + ShadCN UI
- Supabase (Auth & DB)
- OpenAI (for resume tailoring)
- TypeScript

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/resume-ai.git
   cd resume-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

## 📁 Folder Structure

```
app/
 ├── api/generate/route.ts
 ├── auth/callback/page.tsx
 ├── dashboard/
 └── page.tsx
 ├── login/
 └── page.tsx
  
lib/
 └── supabase.ts
 └── mongodb.ts
```

