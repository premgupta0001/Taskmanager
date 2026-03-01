# Setup Guide

This guide covers setting up the Task Manager application locally.

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **pnpm**
- **Supabase Account** (free tier works)
- **Git**

## Step 1: Clone the Repository

```bash
git clone https://github.com/premgupta0001/Taskmanager.git
cd Taskmanager
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Setup Supabase

### Create a Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Enter project details:
   - **Name**: TaskManager
   - **Database Password**: Set a strong password
   - **Region**: Choose closest to you
4. Wait for project to provision

### Run Database Setup SQL

In Supabase Dashboard, go to **SQL Editor** and run:

```sql
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority INT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  completed BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

### Create Profiles Table (Optional)

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000`
   - `http://localhost:8081`
   - `http://localhost:8082`

## Step 4: Configure Environment Variables

### Web App

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile App

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Run the Applications

### Web App

```bash
npm run dev
```

Open http://localhost:3000

### Mobile App

```bash
npm run dev:mobile
```

- Press `w` to run in browser
- Press `a` for Android emulator
- Press `i` for iOS simulator

## Building APKs

### Local Build

For Android, first generate native project:

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK will be at: `apps/mobile/android/app/build/outputs/apk/release/`

### CI/CD Build

Push to `main` branch to trigger GitHub Actions build.

APKs will be available in the Actions artifacts.

## Troubleshooting

### CORS Errors

If you see CORS errors, make sure your Supabase URL is in the allowed origins:

1. Go to Supabase Dashboard → Settings → API
2. Check "Add localhost to allowed domains"

### Build Errors

If `npm install` fails with workspace errors:

```bash
npm install --legacy-peer-deps
```

### Metro Bundler Issues

Clear Metro cache:

```bash
npx expo start --clear
```
