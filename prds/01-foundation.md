# PRD 01 — Foundation

## Goal
Set up Supabase, Figma OAuth, background sync, and all env infrastructure. No UI changes in this phase.

## Tasks

### 1. Install dependencies
```bash
npm install ai @ai-sdk/google @ai-sdk/anthropic @supabase/supabase-js recharts
npx shadcn@latest add progress scroll-area select dropdown-menu sheet toast
```

### 2. Supabase schema
Create `supabase/migrations/001_init.sql`:

```sql
create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  github_id text unique not null,
  github_login text not null,
  github_avatar text,
  github_token text not null,
  figma_token text,
  figma_refresh_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table github_prs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  pr_number int not null,
  repo text not null,
  title text not null,
  description text,
  branch text,
  merged_at timestamptz,
  commit_count int default 0,
  additions int default 0,
  deletions int default 0,
  raw_data jsonb,
  created_at timestamptz default now(),
  unique(user_id, repo, pr_number)
);

create table figma_frames (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  file_key text not null,
  file_name text not null,
  frame_id text not null,
  frame_name text not null,
  thumbnail_url text,
  last_modified timestamptz,
  annotations jsonb,
  raw_data jsonb,
  created_at timestamptz default now(),
  unique(user_id, file_key, frame_id)
);

create table artifacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  pr_id uuid references github_prs(id) on delete set null,
  figma_frame_id uuid references figma_frames(id) on delete set null,
  confidence float default 0,
  manual_override boolean default false,
  created_at timestamptz default now()
);

create table todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  text text not null,
  done boolean default false,
  source text default 'manual',
  created_at timestamptz default now()
);

create table outputs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text not null, -- 'weekly_update' | 'status' | 'case_study' | 'design_doc' | 'handoff_doc' | 'user_docs' | 'system_docs'
  tone text, -- 'builder' | 'stakeholder' | 'achievement'
  content text not null,
  share_id text unique default replace(gen_random_uuid()::text, '-', ''),
  metadata jsonb,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default uuid_generate_v4(),
  output_id uuid references outputs(id) on delete cascade,
  author_name text,
  content text,
  reaction text,
  created_at timestamptz default now()
);

-- indexes
create index idx_github_prs_user_merged on github_prs(user_id, merged_at desc);
create index idx_figma_frames_user_modified on figma_frames(user_id, last_modified desc);
create index idx_artifacts_user on artifacts(user_id);
create index idx_outputs_share on outputs(share_id);
```

### 3. Supabase client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Also create `api/_supabase.ts` for server-side (uses SERVICE_ROLE key):
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 4. Figma OAuth
`api/auth/figma-login.ts` — redirect to Figma:
```typescript
// Redirect: https://www.figma.com/oauth?client_id=CLIENT_ID&redirect_uri=CALLBACK&scope=file_read&state=STATE&response_type=code
```

`api/auth/figma-callback.ts` — exchange code for token:
```typescript
// POST https://api.figma.com/v1/oauth/token
// Store figma_token + figma_refresh_token in users table (looked up by session cookie)
```

### 5. Figma API client
Create `src/lib/figma.ts`:
- `getMe(token)` → GET https://api.figma.com/v1/me
- `getRecentFiles(token)` → GET https://api.figma.com/v1/me/files (if available) or team files
- `getFileFrames(token, fileKey)` → GET https://api.figma.com/v1/files/{file_key}?depth=3 — extract all FRAME nodes
- `getFrameThumbnails(token, fileKey, nodeIds[])` → GET https://api.figma.com/v1/images/{file_key}?ids=NODE1,NODE2&format=png&scale=1

### 6. Background sync
Create `api/sync.ts` — callable as Vercel cron:
- Read session cookie to get user
- Fetch GitHub PRs (last 30 days) → upsert to github_prs
- Fetch Figma recent files → for each file, get frames → upsert to figma_frames
- Run pairing algorithm (see PRD 03) → upsert to artifacts
- Return { synced: { prs: N, frames: N, artifacts: N } }

Add to `vercel.json`:
```json
{
  "crons": [{ "path": "/api/sync", "schedule": "*/15 * * * *" }]
}
```

### 7. .env.example
```
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Figma OAuth  
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Gemini free tier — get from aistudio.google.com)
GOOGLE_GENERATIVE_AI_API_KEY=
# Optional upgrade
ANTHROPIC_API_KEY=

# Session
SESSION_SECRET=
VITE_APP_URL=https://designship.vercel.app
```

## Done when
- [ ] `npm run build` passes
- [ ] Supabase schema file exists
- [ ] Figma OAuth endpoints created
- [ ] `src/lib/figma.ts` and `src/lib/supabase.ts` exist
- [ ] `api/sync.ts` exists
- [ ] Committed: `feat: foundation — Supabase schema, Figma OAuth, sync`
