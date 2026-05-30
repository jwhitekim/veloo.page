-- Lab Toolkit — Supabase 스키마
-- Supabase SQL Editor에서 한 번에 실행

-- ── paper_history ─────────────────────────────────────────────────────────
create table if not exists paper_history (
  id          bigserial primary key,
  query       text,
  paper_id    text,
  title       text,
  result      jsonb        not null,
  created_at  timestamptz  not null default now()
);

create index if not exists paper_history_paper_id_idx on paper_history (paper_id);
create index if not exists paper_history_created_at_idx on paper_history (created_at desc);

-- ── translation_history ───────────────────────────────────────────────────
create table if not exists translation_history (
  id               bigserial primary key,
  source_text      text         not null,
  translated_text  text         not null,
  type             text         not null check (type in ('word', 'sentence')),
  created_at       timestamptz  not null default now()
);

create index if not exists translation_history_source_text_idx on translation_history (source_text);
create index if not exists translation_history_created_at_idx on translation_history (created_at desc);

-- ── arch_history ──────────────────────────────────────────────────────────
create table if not exists arch_history (
  id          bigserial primary key,
  image_name  text,
  explanation jsonb        not null,
  feedback    jsonb,
  created_at  timestamptz  not null default now()
);

create index if not exists arch_history_created_at_idx on arch_history (created_at desc);

CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON sessions(token);
CREATE INDEX ON sessions(expires_at);