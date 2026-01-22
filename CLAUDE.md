# Meal Planner

A Next.js web app for browsing, importing, and selecting meals for weekly planning.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database/Auth/Storage:** Supabase
- **State:** React Context + TanStack React Query
- **Other:** Cheerio (HTML parsing), Tesseract.js (OCR), Zod (validation)

## Commands

```bash
npm run dev    # Development server at localhost:3000
npm run build  # Production build
npm run lint   # Linting
```

## Project Structure

- `app/` - Next.js App Router pages and API routes
  - `api/` - API routes (meals, candidates, categories, weeks, import, upload)
  - `meals/`, `candidates/`, `categories/`, `weeks/` - Page routes
- `components/` - React components (MealCard, MealGrid, Navigation, etc.)
- `lib/` - Utilities and types
  - `types.ts` - Core TypeScript interfaces (Meal, Week, Category, Ingredient)
  - `supabase/` - Supabase client, server client, image utilities, migrations
- `hooks/` - Custom hooks (useRealtimeMeals)

## Key Features

- Import meals from URLs, Paprika exports, or cookbook photos (OCR)
- Browse meals in responsive grid with selection
- Weekly meal planning
- Real-time sync across devices via Supabase subscriptions
- Meal categorization

## Documentation

- `README.md` - Quick start
- `DESIGN.md` - Architecture and feature specifications
- `SETUP.md` - Environment setup and Supabase configuration
