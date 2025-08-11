# AI Resume Tailor

AI-powered web application that generates ATS-friendly, job-specific resumes using Next.js 14, n8n and Supabase.

Live Demo : https://ai-resume-tailor-hlqg-k4nwwiquz-alishbas-projects-489d7425.vercel.app

## Features

- Email authentication via Supabase
- AI-generated resume content tailored to job descriptions  
- Save resumes to personal dashboard
- Fully responsive design (mobile + desktop)
- Fast UI with Next.js App Router

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: Supabase (Auth + DB), N8N on Railway.com
- **AI**: OpenRouter API with Google Gemma via N8N workflow
- **Deployment**: Vercel

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/ai-resume-tailor.git
   cd ai-resume-tailor
   npm install
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_N8N_WEBHOOK_URL=your_railway_n8n_webhook_url
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

## N8N Workflow Setup on Railway

1. **Deploy N8N on Railway**
   - Create account on [railway.com](https://railway.com)
   - Deploy N8N template
   - Configure environment variables

2. **Create Workflow**
   - **Webhook**: Receives POST requests from Next.js app
   - **Code**: Processes and formats input data
   - **HTTP Request**: Calls OpenRouter API with Google Gemma model
   - **Respond to Webhook**: Returns formatted resume content

3. **OpenRouter Configuration**
   ```json
   {
     "model": "google/gemma-3-27b-it:free",
     "messages": [
       {
         "role": "user",
         "content": "{{$json.input}}"
       }
     ]
   }
   ```

4. **Set Environment Variables**
   - Add OpenRouter API key in N8N settings
   - Configure webhook URL in your Next.js environment

## Project Structure

```
app/
├── api/generate/route.ts     # AI generation endpoint
├── dashboard/page.tsx        # Main dashboard
├── login/page.tsx           # Auth page
└── page.tsx                 # Landing page

lib/
├── supabase.ts              # Supabase client
└── types.ts                 # TypeScript types

components/
└── ResumeForm.tsx           # Resume input form
```

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-resume-tailor)

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_N8N_WEBHOOK_URL`

