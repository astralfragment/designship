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
