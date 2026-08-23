-- SafeAR — Supabase schema (PRD 6.3)
-- Run this in the Supabase SQL editor, then seed.sql.

-- ---------------------------------------------------------------- tables

create table if not exists public.modules (
  id              text primary key,
  name            text not null,
  description     text,
  total_questions int  not null default 5,
  pass_score      int  not null default 80
);

create table if not exists public.workers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null unique,
  department text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id            text primary key,
  module_id     text not null references public.modules(id) on delete cascade,
  question_text jsonb not null,   -- { "en": "...", "hi": "..." }
  options       jsonb not null,   -- { "en": [...], "hi": [...] }
  correct_index int   not null,
  explanation   jsonb
);

create table if not exists public.completions (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.workers(id) on delete cascade,
  module_id    text not null references public.modules(id) on delete cascade,
  score        int  not null,
  passed       boolean not null,
  attempts     int  not null default 1,
  completed_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  worker_id   uuid not null references public.workers(id) on delete cascade,
  -- Denormalised on purpose: /verify is anonymous, and this lets a public read
  -- on THIS table alone answer an inspector's scan without ever exposing the
  -- workers table to unauthenticated clients.
  worker_name text not null,
  department  text not null,
  module_id   text not null references public.modules(id) on delete cascade,
  score       int  not null,
  issued_at   timestamptz not null default now(),
  valid_until timestamptz not null
);

create index if not exists completions_worker_idx  on public.completions(worker_id);
create index if not exists certificates_worker_idx on public.certificates(worker_id);

-- ------------------------------------------------------------------- RLS
-- PRD 10: "Supabase RLS prevents cross-user data access".

alter table public.modules      enable row level security;
alter table public.questions    enable row level security;
alter table public.workers      enable row level security;
alter table public.completions  enable row level security;
alter table public.certificates enable row level security;

-- Course content is public reference data.
drop policy if exists modules_read on public.modules;
create policy modules_read on public.modules for select using (true);

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions for select using (true);

-- A certificate must be readable by anyone holding its id — that is the whole
-- point of the QR code. Ids are v4 UUIDs, so they are unguessable; enumeration
-- is not possible through PostgREST without the exact id only because the
-- policy below is paired with a client that always filters by id.
--
-- NOTE for the finals build: this policy does allow a full table scan by an
-- anonymous client. Before any real deployment, replace it with a SECURITY
-- DEFINER function `verify_certificate(uuid)` that returns a single row, and
-- drop this blanket select. It is acceptable for the hackathon demo only
-- because the data set is synthetic.
drop policy if exists certificates_public_verify on public.certificates;
create policy certificates_public_verify on public.certificates for select using (true);

-- Workers are created by the (anonymous) training app, but their details must
-- NOT be readable by anonymous clients — that would expose every worker's name
-- and phone number to the internet. So there is no anon select policy here and
-- registration goes through the SECURITY DEFINER function below instead.
--
-- (An anon `insert(...).select()` would need a select policy to return the new
-- row, which is exactly the leak we are avoiding. Hence the function.)
drop policy if exists workers_insert on public.workers;

drop policy if exists workers_read_staff on public.workers;
create policy workers_read_staff on public.workers
  for select using (auth.role() = 'authenticated');

-- Registers a worker, or returns the existing one for that phone number, so a
-- returning worker keeps their id and therefore their training history.
create or replace function public.register_worker(
  p_name       text,
  p_phone      text,
  p_department text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from workers where phone = p_phone;

  if v_id is null then
    insert into workers (name, phone, department)
    values (p_name, p_phone, p_department)
    returning id into v_id;
  else
    update workers set name = p_name, department = p_department where id = v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.register_worker(text, text, text) from public;
grant execute on function public.register_worker(text, text, text) to anon, authenticated;

drop policy if exists completions_insert on public.completions;
create policy completions_insert on public.completions for insert with check (true);

drop policy if exists completions_read_staff on public.completions;
create policy completions_read_staff on public.completions
  for select using (auth.role() = 'authenticated');

drop policy if exists certificates_insert on public.certificates;
create policy certificates_insert on public.certificates for insert with check (true);
