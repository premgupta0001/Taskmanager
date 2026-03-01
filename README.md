# Task Manager

Cross-platform task management application with smart task prioritization.

## Features

- **Authentication** - Email/password signup and login (OAuth ready for Google, GitHub)
- **Task Management** - Create, read, delete, and toggle task completion
- **Priority System** - 5-level priority system (Critical, High, Medium, Low, Minimal)
- **Smart Organization** - Tasks automatically sorted by priority + age algorithm
- **Cross-Platform** - Web (Next.js) and Mobile (React Native/Expo)

## 🚀 Live Demo

**Web App**: https://taskmanager-premgupta.vercel.app/

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web App | Next.js 14 (App Router) |
| Mobile App | Expo SDK 52 + React Native |
| Backend | Supabase |
| Auth | Supabase Auth |
| Database | PostgreSQL |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### Installation

```bash
# Install all dependencies with pnpm
pnpm install
```

### Run Web App

```bash
pnpm dev
```

Open http://localhost:3000

### Run Mobile App

```bash
pnpm dev:mobile
```

Press `w` to run in browser, or `a` for Android emulator.

## Project Structure

```
.
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/               # App router pages
│   │   │   ├── page.tsx       # Main dashboard
│   │   │   └── login/         # Authentication
│   │   └── components/        # React components
│   │
│   └── mobile/                # Expo mobile application
│       ├── app/               # Expo Router pages
│       │   ├── (auth)/        # Authentication screens
│       │   └── (tabs)/        # Main tabs
│       ├── components/        # React Native components
│       └── context/           # React Context providers
│
├── packages/
│   ├── shared/                # Shared TypeScript types
│   │   └── src/types/        # TypeScript interfaces
│   │
│   └── supabase/             # Supabase client & helpers
│       └── src/client.ts     # Auth & CRUD methods
│
└── .github/
    └── workflows/             # CI/CD pipelines
        └── build-android.yml # Android APK build
```

## Environment Variables

### Web App

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Mobile App

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Smart Task Algorithm

Tasks are sorted using a priority + age algorithm:

```typescript
score = (6 - priority) * 100 + daysSinceCreated
```

- **Lower score = Do first**
- Priority 1 (Critical) gets highest base score (500)
- Priority 5 (Minimal) gets lowest base score (100)
- Older tasks get a small boost to break ties

## Building APKs

Pushes to the `main` branch automatically trigger GitHub Actions to build APKs.

### Generated APKs

| File | Architecture |
|------|-------------|
| `task-manager-arm64_<hash>.apk` | 64-bit ARM |
| `task-manager-armeabi-v7a_<hash>.apk` | 32-bit ARM |
| `task-manager-x86_64_<hash>.apk` | 64-bit x86 |
| `task-manager-universal_<hash>.apk` | All architectures |

Download from [GitHub Releases](https://github.com/premgupta0001/Taskmanager/releases).

## License

MIT
