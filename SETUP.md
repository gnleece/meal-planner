# Setup Guide

## Step 2: Configure Environment Variables

You need to create a `.env.local` file in the root of your project with your Supabase credentials.

### Getting Your Supabase Credentials

1. **Go to your Supabase project dashboard**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Find your Project URL and API Keys**
   - In the left sidebar, click on **Settings** (gear icon)
   - Click on **API** in the settings menu
   - You'll see two important values:
     - **Project URL** - This is your `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Create the `.env.local` file**
   - In the root directory of your project (same level as `package.json`), create a new file named `.env.local`
   - Add the following content, replacing the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Example `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example-signature
```

### Important Notes:

- **Never commit `.env.local` to git** - It's already in `.gitignore`
- The `NEXT_PUBLIC_` prefix makes these variables available to the browser
- The anon key is safe to expose in the browser - it's designed for client-side use
- Make sure there are no quotes around the values
- No spaces around the `=` sign

### Verifying Your Setup

After creating the `.env.local` file:
1. Restart your development server if it's running (`Ctrl+C` then `npm run dev`)
2. The app should now be able to connect to your Supabase project

### Troubleshooting

If you get errors about missing environment variables:
- Make sure the file is named exactly `.env.local` (not `.env.local.txt` or similar)
- Make sure the file is in the root directory (same folder as `package.json`)
- Restart your development server after creating/modifying the file
- Check that there are no typos in the variable names

## Step 3: Install Dependencies

### What is `npm install`?

`npm install` reads your `package.json` file and downloads all the required packages (dependencies) that your application needs to run. These packages are stored in a `node_modules` folder.

### How to Run It

1. **Open your terminal/command prompt**
   - Make sure you're in the project root directory (`meal-planner`)
   - You can verify this by checking that you can see `package.json` in the current directory

2. **Run the command:**
   ```bash
   npm install
   ```
   
   Or the shorter version:
   ```bash
   npm i
   ```

3. **Wait for it to complete**
   - This may take 1-3 minutes depending on your internet connection
   - You'll see progress indicators as packages are downloaded
   - When complete, you'll see a message like "added XXX packages"

### What Gets Installed?

The command installs two types of packages:

**Production Dependencies** (needed to run the app):
- `next` - The Next.js framework
- `react` & `react-dom` - React library for building UI
- `@supabase/supabase-js` & `@supabase/ssr` - Supabase client libraries
- `@tanstack/react-query` - Data fetching and state management
- `cheerio` - HTML parsing for recipe scraping
- `tesseract.js` - OCR library for extracting text from images
- `date-fns` - Date utility library
- `zod` - Schema validation library

**Development Dependencies** (only needed during development):
- `typescript` - TypeScript compiler
- `@types/*` - TypeScript type definitions
- `tailwindcss`, `postcss`, `autoprefixer` - CSS processing
- `eslint` - Code linting tool

### What You'll See

A successful installation will show:
```
added 500+ packages, and audited 500+ packages in 30s
```

You'll also see a new `node_modules` folder created (this contains all the packages).

### Troubleshooting Common Issues

**Issue: "npm: command not found"**
- **Solution**: Node.js/npm is not installed. Download from [nodejs.org](https://nodejs.org/)
- Install the LTS (Long Term Support) version
- After installing, restart your terminal

**Issue: "EACCES: permission denied"**
- **Solution**: On Mac/Linux, you might need to use `sudo npm install` (not recommended)
- Better solution: Fix npm permissions or use a Node version manager like `nvm`

**Issue: "npm ERR! network" or timeout errors**
- **Solution**: Check your internet connection
- Try clearing npm cache: `npm cache clean --force`
- If behind a corporate firewall, you may need to configure npm proxy settings

**Issue: "npm ERR! code ERESOLVE" (dependency conflicts)**
- **Solution**: Try `npm install --legacy-peer-deps`
- Or use `npm install --force` (use with caution)

**Issue: Installation is very slow**
- **Solution**: This is normal for the first install
- Subsequent installs will be faster due to caching
- Consider using `yarn` or `pnpm` as alternative package managers if npm is too slow

**Issue: Warnings about vulnerabilities**
- **Solution**: Run `npm audit fix` to automatically fix known vulnerabilities
- Some warnings may be false positives or in dev dependencies only

### After Installation

Once `npm install` completes successfully:
- You'll have a `node_modules` folder (don't edit files in here)
- You'll have a `package-lock.json` file (tracks exact versions - commit this to git)
- You're ready to proceed to step 4: running the development server

### Verifying Installation

You can verify everything is installed correctly by checking:
```bash
npm list --depth=0
```

This shows all top-level packages that were installed.

## Step 4: Run SQL Migrations

### What are SQL Migrations?

The SQL migration file (`lib/supabase/migrations.sql`) contains the database schema - it creates all the tables, indexes, and security policies needed for the app to work.

### How to Run Them

1. **Go to your Supabase project dashboard**
   - Visit [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open the SQL Editor**
   - In the left sidebar, click on **SQL Editor**

3. **Create a new query**
   - Click the **New query** button

4. **Copy and paste the migration file**
   - Open `lib/supabase/migrations.sql` in your code editor
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor

5. **Run the query**
   - Click the **Run** button (or press `Ctrl+Enter`)
   - You should see a success message

### What Gets Created?

The migration creates:
- `meals` table - Stores all meal/recipe data
- `weeks` table - Stores weekly meal selections
- Row Level Security (RLS) policies - Ensures users can only access their own data
- Indexes - For fast queries
- Triggers - For automatic timestamp updates

### Verifying the Migration

After running the migration, you can verify it worked:
1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see two tables: `meals` and `weeks`
3. Both tables should have the columns defined in the migration

## Step 5: Start the Development Server

### What is `npm run dev`?

This command starts the Next.js development server, which:
- Compiles your TypeScript/React code
- Serves your app at `http://localhost:3000`
- Watches for file changes and automatically reloads
- Provides helpful error messages

### How to Run It

1. **Make sure you're in the project root directory**
   - You should be in the `meal-planner` folder

2. **Run the command:**
   ```bash
   npm run dev
   ```

3. **Wait for it to start**
   - You'll see compilation messages
   - When ready, you'll see: `✓ Ready in X seconds`
   - The server will be running at `http://localhost:3000`

### What You'll See

A successful start will show something like:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

### Opening the App

1. **Open your web browser**
2. **Navigate to:** `http://localhost:3000`
3. **You should see:**
   - The login page (if not authenticated)
   - Or be redirected to the meals/weeks page (if already logged in)

### First Time Setup

When you first open the app:
1. You'll be redirected to the login page
2. Click "Sign up" to create an account
3. Enter your email and password
4. You'll be automatically signed in and redirected to the week planning page

### Troubleshooting

**Issue: "Port 3000 is already in use"**
- **Solution**: Another app is using port 3000
- Option 1: Stop the other app using port 3000
- Option 2: Use a different port: `npm run dev -- -p 3001`

**Issue: "Cannot find module" errors**
- **Solution**: Make sure you ran `npm install` first
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

**Issue: "Error: Invalid API key" or Supabase connection errors**
- **Solution**: Check your `.env.local` file
- Make sure the Supabase URL and anon key are correct
- Restart the dev server after changing `.env.local`

**Issue: "Error: relation 'meals' does not exist"**
- **Solution**: You need to run the SQL migrations in Supabase
- Go back to Step 4 and run the migration script

**Issue: Page shows blank or errors**
- **Solution**: Check the terminal for error messages
- Common issues: missing environment variables, database connection problems
- Make sure all setup steps were completed

### Stopping the Server

To stop the development server:
- Press `Ctrl+C` in the terminal where it's running

### Next Steps

Once the app is running:
1. Create your first account (sign up)
2. Try adding a meal manually
3. Try importing a meal from a URL
4. Browse and select meals for your week

Congratulations! Your meal planner app is now running! 🎉
