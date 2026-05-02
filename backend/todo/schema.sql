-- Supabase SQL Editor에서 실행하세요

create table if not exists todos (
  id        bigserial primary key,
  name      text        not null,
  memo      text        not null default '',
  priority  text        not null default 'normal',
  deadline  text        not null default '',
  done      boolean     not null default false,
  ai_strategy text      not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists steps (
  id          bigserial primary key,
  todo_id     bigint      not null references todos(id) on delete cascade,
  text        text        not null,
  done        boolean     not null default false,
  order_index integer     not null default 0
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists todos_updated_at on todos;
create trigger todos_updated_at
  before update on todos
  for each row execute function update_updated_at();
