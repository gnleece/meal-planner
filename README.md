# Meal Planner

A web application for browsing and selecting meals for weekly planning, similar to Home Chef's meal selection experience.

## Features

- Import meals from URLs, Paprika exports, or cookbook photos (OCR)
- Browse meals in a responsive grid view
- Select meals for weekly planning
- Real-time sync across devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL migrations from `lib/supabase/migrations.sql` in your Supabase SQL editor
   - Copy your Supabase URL and anon key

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

Run the SQL migrations in `lib/supabase/migrations.sql` in your Supabase SQL editor to create the necessary tables and policies.
