-- Supabase SQL Editor에서 실행하세요

create table if not exists paper_analyses (
    id               uuid        primary key default gen_random_uuid(),
    title            text,
    doi              text,
    arxiv_id         text,
    domain           text,
    keywords         text[],
    problem_short    text,
    method_short     text,
    conclusion_short text,
    full_result      jsonb,
    source           text,
    created_at       timestamptz not null default now()
);
