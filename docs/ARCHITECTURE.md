# Architecture

This document describes the technical architecture of the Task Manager application.

## Overview

The Task Manager is a monorepo containing:

1. **Web Application** - Next.js 14 with App Router
2. **Mobile Application** - Expo (React Native)
3. **Shared Packages** - TypeScript types and Supabase client

## Monorepo Structure

```
taskmanager/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/               # App router (pages)
│   │   ├── components/        # React components
│   │   └── package.json      # Dependencies
│   │
│   └── mobile/                # Expo mobile app
│       ├── app/               # Expo Router (file-based routing)
│       ├── components/        # React Native components
│       ├── context/           # React Context providers
│       ├── android/           # Generated native Android project
│       └── package.json       # Dependencies
│
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   └── types/         # TypeScript interfaces
│   │   └── package.json
│   │
│   └── supabase/              # Supabase client
│       ├── src/
│       │   └── client.ts      # Auth & CRUD methods
│       └── package.json
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│
└── package.json              # Root workspace config
```

## Technology Stack

### Web App
- **Framework**: Next.js 14
- **Routing**: App Router (`app/` directory)
- **Rendering**: Server Components + Client Components
- **Styling**: Inline styles (minimal)

### Mobile App
- **Framework**: Expo SDK 52
- **Routing**: Expo Router (file-based)
- **Language**: TypeScript
- **Components**: React Native

### Backend
- **Auth**: Supabase Auth
- **Database**: PostgreSQL
- **API**: Supabase REST API

## Data Flow

### Authentication Flow

1. User enters email/password on login screen
2. App calls Supabase Auth API
3. Supabase validates and returns session
4. Session stored in client (cookies/localStorage)
5. Protected routes check for valid session

```
User Login
    ↓
Supabase Auth API
    ↓
Session Token
    ↓
Client Storage (cookies/localStorage)
    ↓
Protected Routes
```

### Task CRUD Flow

1. Authenticated user creates task
2. App calls `tasks.create()` from `@taskmanager/supabase`
3. Supabase client sends request with auth token
4. RLS policy validates user owns the task
5. Database inserts task with user_id
6. UI updates with new task

## Shared Packages

### @taskmanager/shared

Contains TypeScript interfaces used by both web and mobile:

```typescript
// packages/shared/src/types/index.ts
export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### @taskmanager/supabase

Contains Supabase client and helper methods:

```typescript
// packages/supabase/src/client.ts
export const auth = {
  async signIn(email: string, password: string) { ... },
  async signUp(email: string, password: string) { ... },
  async signOut() { ... },
};

export const tasks = {
  async create(taskInput: TaskInput) { ... },
  async getAll() { ... },
  async delete(id: string) { ... },
  async toggleComplete(id: string, completed: boolean) { ... },
};
```

## Smart Task Algorithm

Tasks are sorted using a priority + age scoring system:

```typescript
function calculateScore(task: Task): number {
  const createdAt = new Date(task.created_at).getTime();
  const daysSinceCreated = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  
  // Priority 1 = 500, Priority 5 = 100
  const priorityScore = (6 - task.priority) * 100;
  
  // Older tasks get small boost
  const ageScore = daysSinceCreated;
  
  return priorityScore + ageScore;
}

// Sort: lowest score first
tasks.sort((a, b) => calculateScore(a) - calculateScore(b));
```

### Why This Works

| Priority | Base Score | Effect |
|----------|-----------|--------|
| 1 (Critical) | 500 | Always at top |
| 2 (High) | 400 | Near top |
| 3 (Medium) | 300 | Middle |
| 4 (Low) | 200 | Lower |
| 5 (Minimal) | 100 | Lowest |

The age boost ensures older tasks of the same priority are completed first.

## Security

### Row Level Security (RLS)

All task operations are protected by Supabase RLS policies:

```sql
-- Only owners can view their tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Only owners can insert tasks
CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only owners can update their tasks
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Only owners can delete their tasks
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

### Environment Variables

- `NEXT_PUBLIC_*` - Exposed to web client
- `EXPO_PUBLIC_*` - Exposed to mobile client
- Never expose secret keys (use anon keys only)

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/build-android.yml`):

1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Generate Android project (`expo prebuild`)
5. Build 4 APK variants:
   - ARM64
   - ARMv7
   - x86_64
   - Universal
6. Upload as artifacts

APKs are built with bundled JavaScript (standalone, no Metro needed).

## Future Improvements

1. **OAuth Providers** - Add Google, GitHub login
2. **Task Categories** - Group tasks by project/tag
3. **Due Dates** - Add deadline support
4. **Reminders** - Push notifications
5. **Offline Support** - Local-first with sync
6. **Web Push Notifications** - Service workers
